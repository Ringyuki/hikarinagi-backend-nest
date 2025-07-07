export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    hikariAccessTokenExpiresIn: process.env.HIKARI_ACCESS_TOKEN_EXPIRES_IN || '1h',
    hikariRefreshTokenExpiresIn: process.env.HIKARI_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
})
