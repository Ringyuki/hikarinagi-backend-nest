export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/hikarinagi',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH,
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  email: {
    elasticEmailApiKey: process.env.ELASTIC_EMAIL_API_KEY,
  },
  reader: {
    readerSignatureSecret: process.env.READER_SIGNATURE_SECRET,
  },
  galDownload: {
    downloadSignatureSecret: process.env.DOWNLOAD_SIGNATURE_SECRET,
  },
  r2: {
    r2Endpoint: process.env.R2_ENDPOINT,
    novel: {
      r2LightNovelAccessKey: process.env.R2_LIGHTNOVEL_ACCESS_KEY,
      r2LightNovelSecretKey: process.env.R2_LIGHTNOVEL_SECRET_KEY,
      r2LightNovelBucket: process.env.R2_LIGHTNOVEL_BUCKET,
    },
    images: {
      r2ImageAccessKey: process.env.R2_IMAGE_ACCESS_KEY,
      r2ImageSecretKey: process.env.R2_IMAGE_SECRET_KEY,
      r2ImageBucket: process.env.R2_IMAGE_BUCKET,
    },
  },
  bangumi: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
})
