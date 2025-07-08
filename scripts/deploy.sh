#!/bin/bash

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 环境检查
check_environment() {
    log_info "检查环境..."
    
    # 检查必要的工具
    local required_tools=("git" "pnpm" "pm2" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "缺少必要工具: $tool"
            return 1
        fi
    done
    
    # 检查环境变量
    local required_vars=("NODE_ENV" "APP_PATH")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "缺少环境变量: $var"
            return 1
        fi
    done
    
    log_info "环境检查通过"
}

# 备份当前版本
backup_current_version() {
    log_info "备份当前版本..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份 dist 目录
    if [[ -d "dist" ]]; then
        cp -r dist "$backup_dir/"
        log_info "已备份到: $backup_dir"
    else
        log_warn "没有找到 dist 目录，跳过备份"
    fi
}

# 健康检查
health_check() {
    local url="${1:-http://localhost:${PORT:-3005}}"
    local max_attempts=30
    local wait_time=2
    
    log_info "进行健康检查..."
    
    for ((i=1; i<=max_attempts; i++)); do
        if curl -f "$url/health" &>/dev/null; then
            log_info "健康检查通过 (尝试 $i/$max_attempts)"
            return 0
        fi
        
        if [[ $i -eq $max_attempts ]]; then
            log_error "健康检查失败，已尝试 $max_attempts 次"
            return 1
        fi
        
        log_warn "健康检查失败，等待 ${wait_time}s 后重试... ($i/$max_attempts)"
        sleep $wait_time
    done
}

# 回滚
rollback() {
    log_error "部署失败，开始回滚..."
    
    # 找到最新的备份
    local latest_backup=$(find backups -type d -name "*_*" | sort | tail -1)
    
    if [[ -n "$latest_backup" && -d "$latest_backup" ]]; then
        log_info "回滚到: $latest_backup"
        
        # 停止当前应用
        pm2 stop hikarinagi-backend-nestjs || true
        
        # 恢复备份
        rm -rf dist
        cp -r "$latest_backup/dist" .
        
        # 重启应用
        pm2 restart hikarinagi-backend-nestjs
        
        log_info "回滚完成"
    else
        log_error "没有找到可用的备份"
        return 1
    fi
}

# 主要部署流程
deploy() {
    local env="${1:-production}"
    
    log_info "开始部署到 $env 环境..."
    
    # 环境检查
    check_environment || { log_error "环境检查失败"; return 1; }
    
    # 备份当前版本
    backup_current_version
    
    # 设置错误处理
    trap 'log_error "部署过程中发生错误"; rollback; exit 1' ERR
    
    # 拉取代码
    log_info "拉取最新代码..."
    git fetch --all
    git reset --hard origin/main
    
    # 安装依赖
    log_info "安装依赖..."
    pnpm install --frozen-lockfile --prefer-offline
    
    # 构建应用
    log_info "构建应用..."
    pnpm run build
    
    # 重启应用
    log_info "重启应用..."
    if pm2 list | grep -q "hikarinagi-backend-nestjs"; then
        pm2 restart hikarinagi-backend-nestjs
    else
        pm2 start ecosystem.config.js --env "$env"
    fi
    
    pm2 save
    
    # 健康检查
    health_check || { log_error "健康检查失败"; rollback; return 1; }
    
    # 清理旧备份（保留最近5个）
    find backups -type d -name "*_*" | sort | head -n -5 | xargs rm -rf
    
    log_info "部署完成！"
}

# 主程序
main() {
    local env="${1:-production}"
    
    case "$env" in
        staging|production)
            deploy "$env"
            ;;
        *)
            log_error "无效的环境: $env"
            echo "使用方法: $0 [staging|production]"
            exit 1
            ;;
    esac
}

# 设置必要的环境变量
export NODE_ENV="${NODE_ENV:-production}"
export APP_PATH="${APP_PATH:-/app}"
export PORT="${PORT:-3005}"

# 执行主程序
main "$@" 