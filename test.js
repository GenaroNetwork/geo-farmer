let GEOIP = require("./index")
new GEOIP().on("load",async db => {

    // 测试
    let getIpv4 = () => {
        let i1 = Math.floor(Math.random() * 255) + 1
        let i2 = Math.floor(Math.random() * 255) + 1
        let i3 = Math.floor(Math.random() * 255) + 1
        let i4 = Math.floor(Math.random() * 255) + 1
        return `${i1}.${i2}.${i3}.${i4}`
    }

    let getIpv6 = () => {
        let arr = [];
        for (let i = 0; i < 8; i++ ) {
            let i = Math.floor(Math.random() * Math.pow(16,4)) + 1
            i = i.toString(16)
            arr.push(i)
        }
        return arr.join(":")
    }

    for(let i = 0; i<100; i++) {
        let ipv4 = getIpv4()
        await db.addFarmer(ipv4, ipv4)

        let ipv6 = getIpv6()
        await db.addFarmer(ipv6, ipv6)
    }

    let ipv4 = getIpv4()
    console.log(await db.getNeighbor(ipv4,5))

    let ipv6 = getIpv6()
    console.log(await db.getNeighbor(ipv6,5))
})