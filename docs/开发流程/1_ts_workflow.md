# 1 TS Workflow

目标：完成项目创建。

任务：

-   能够成功运行 `yarn dev`: 实现项目开发阶段 compile
-   能够运行 `yarn build`: 完成项目的 compile
-   能够运行 `yarn start`: 能够成功运行已 compile 的代码

需要实现的 tooling 功能：

-   `yarn dev` 的 hot reload
-   absolute import

## 前提

已经安装

-   Node: v16
-   Yarn

## tsconfig 的配置

值得注意的是：lib、module 和 target。参考了[这篇文章](https://stackoverflow.com/questions/67371787/what-typescript-configuration-produces-output-closest-to-node-js-16-capabilities)

```json
{
    "compilerOptions": {
        "lib": ["ES2021"],
        "module": "CommonJS",
        "target": "ES2021"
    }
}
```

使用`"module": "ES2020",`会让 ts-node 无法使用，因此改用作者推荐的后一个方法。

## code

[Github Repo](https://github.com/YuPototo/express_mongo_example/tree/791b38ce396a7699f725e12233c7b746570647ad)
