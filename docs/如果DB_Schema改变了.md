# 如果 DB Schema 改变了，怎么办

## 开发阶段

修改了 `schema.prisma` 文件，需要将 migration 应用到开发数据库上。
https://www.prisma.io/docs/concepts/components/prisma-migrate#development-environments

## 生产环境

需要将 migration 应用到生产环境。
https://www.prisma.io/docs/concepts/components/prisma-migrate#production-and-testing-environments
