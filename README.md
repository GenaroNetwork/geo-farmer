### 使用方法：  
``` 
npm i
```


```
let GEOIP = require("./index")
new GEOIP().on("load",async db => {
    // 数据库加载完成
    await db.addFarmer(FARMER_ID, FARMER_IP, COMMENT)
    // FARMER_ID 需要是唯一的 id  —— String
    // FARMER_IP 可以是 ipv4 地址或者 ipv6 地址。 查询的时候会分开处理 —— String
    // COMMENT 为备注 - String
    // 该方法无返回值


    console.log(await db.getNeighbor(USER_IP, LIMIT, SQL_COLUMN)
    // USER_IP 为用户 IP —— String
    // LIMIT 为需要查询的 farmer 数量 —— Int
    // SQL_COLUMN 为 SQL 语法的列数，如  * ，默认为 farmerIp, farmerId ， 可以传入 * 查看返回的值确定可传入的所有参数  —— String

    // 该方法会根据 USER_IP 区分 ipv4 与 ipv6，即 ipv4 用户只能查找到 ipv4 的farmer

    // 该方法的返回值为 Object
    // farmerEnough 代表查询结果是否能满足最低的数量要求。例如，要求 5 个 farmer ，查询完毕之后只有4 个
    // query 为查询结果，格式为 SQL_COLUMN 参数规定格式的数组 （一般只需要关注这个值，后面的可以忽略）
    // queryExactly 为 query 中的精确结果，即同时 ASN 与 城市相同， 格式同上
    // queryAsn 为 query 中 ASN 相同的结果， 格式同上
    // queryCity 为 query 中城市相同的结果， 格式同上
    // queryAsnOrCity 为 query 中ASN 或城市相同的结果， 格式同上
    // queryCountry 为 query 中国家相同的结果， 格式同上
    // queryAll 为 query 中以上都不符合的结果， 格式同上
})

```
