# 3 unit test

## 定义

单元测试需要满足如下必要条件：

-   只测试一个 function 或 class
-   如果这个 function 调用了第三方 function，那么需要 mock 这个第三方 function。这让 function 的返回值变得彻底可以预测。

按照这个定义，即使调用自己写的 function，也应该 mock。

如果不去 mock 第三方函数，那么这个测试应该是 integration test。

## 文件结构

-   exampleModule：module 文件夹
    -   \_\_tests\_\_: tests 文件夹
        -   integration: 所有的 integration 测试
        -   unit: 所有的 unitest
    -   `index.ts`

`package.json` 内有一个 scripts:`"test": "jest"`

在这个结构下：

-   `yarn test unit` 会运行所有的单元测试
-   `yarn test int`: 会运行所有的 integration test
-   `yarn test`: 会运行所有的测试

补充，如果只有一种 test，比如只有 integration test，可以放弃使用文件夹结构。修改文件名即可。
比如：`someModule.unit.test.ts`

## code

[Github Repo](https://github.com/YuPototo/express_mongo_example/tree/49cb80c1d03ec03e86fcdeefb97d94bf18d2d468)
