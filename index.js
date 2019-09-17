const { EventEmitter } = require("events")
const sqlite = require("sqlite")
const DBNAME = "farmer_ip_geo_asn"

module.exports = class extends EventEmitter {
    constructor(){
        super()
        this.init()
    }
    // async farmer

    async init(){
        const Reader = require("@maxmind/geoip2-node").Reader;
        this._ipasn = await Reader.open(__dirname + "/db/ipasn.mmdb", {})
        this._ipgeo = await Reader.open(__dirname + "/db/ipgeo.mmdb", {})
        this._sqlite = await sqlite.open(__dirname + "/db/farmerip.sqlite", {cache: true})
        await this.initDB()
        this.emit("load", this)
    }

    async initDB(){
        await this._sqlite.all(`
        CREATE TABLE IF NOT EXISTS ${DBNAME} (
            farmerId TEXT PRIMARY KEY,
            farmerIp TEXT NOT NULL,
            farmerIpIsIpv6 BOOLEAN DEFAULT 0,
            farmerAsn INTERGER DEFAULT 0,
            farmerAsnName TEXT,
            farmerCity INTERGER DEFAULT 0,
            farmerCityName TEXT,
            farmerCountry INTERGER DEFAULT 0,
            farmerCountryName TEXT,
            farmerEtc TEXT
        )`)
    }

    async addFarmer(farmerId, farmerIp, farmerEtc = null){
        const farmerIpIsIpv6 = this.isIpv6(farmerIp)
        let asn,city,farmerAsn,farmerAsnName,farmerCity,farmerCityName,farmerCountry,farmerCountryName
        try{
            asn = await this._ipasn.asn(farmerIp)
            farmerAsn = asn.autonomousSystemNumber || 0
            farmerAsnName = asn.autonomousSystemOrganization
        }catch(e){
            farmerAsn = 0
            farmerAsnName = JSON.stringify({})
        }

        try{
            city = await this._ipgeo.city(farmerIp)
            farmerCity = city.city.geonameId || 0
            farmerCountry = city.country.geonameId || 0
            farmerCityName = JSON.stringify(city.city)
            farmerCountryName = JSON.stringify(city.country)
        }catch(e){
            farmerCity = 0
            farmerCountry = 0
            farmerCityName = JSON.stringify({})
            farmerCountryName = JSON.stringify({})
        }

        await this._sqlite.all(`
        REPLACE INTO ${DBNAME} 
            (farmerId, farmerIp, farmerIpIsIpv6, farmerAsn, farmerAsnName, farmerCity, farmerCityName, farmerCountry, farmerCountryName, farmerEtc)
        VALUES
            ('${farmerId}', '${farmerIp}', ${farmerIpIsIpv6}, '${farmerAsn}', '${farmerAsnName}', '${farmerCity}', '${farmerCityName}', '${farmerCountry}', '${farmerCountryName}', '${farmerEtc}')
        `)

    }

    async getNeighbor(userIp, number, SELECT_COLUMN = "farmerIp, farmerId"){
        const userIpIsIpv6 = this.isIpv6(userIp)
        let asn,city,userAsn,userCity,userCountry
        try{
            asn = await this._ipasn.asn(userIp)
            userAsn = asn.autonomousSystemNumber || 0
        }catch(e){
            userAsn = 0
        }

        try{
            city = await this._ipgeo.city(userIp)
            userCity = city.city.geonameId || 0
            userCountry = city.country.geonameId || 0
        }catch(e){
            userCity = 0
            userCountry = 0
        }


        const query = []
        const queryExactly = []
        const queryCity = []
        const queryAsn = []
        const queryAsnOrCity = []
        const queryCountry = []
        const queryAll = []
        const data = {
            farmerEnough: true,query, queryExactly, queryCity, queryAsn, queryAsnOrCity, queryCountry, queryAll
        }
        let leftNumber = number

        
        queryExactly.push(...await this._sqlite.all(`
        SELECT ${SELECT_COLUMN} FROM ${DBNAME} 
        WHERE (farmerAsn = '${userAsn}' AND farmerCity = '${userCity}')
        AND farmerIpIsIpv6 = ${userIpIsIpv6}
        ORDER BY random()
        LIMIT '${number}'
        `))
        query.push(...queryExactly)
        leftNumber = number - queryExactly.length
        if (leftNumber === 0) return data

        
        queryCity.push(...await this._sqlite.all(`
        SELECT ${SELECT_COLUMN} FROM ${DBNAME} 
        WHERE (farmerAsn != '${userAsn}' AND farmerCity = '${userCity}')
        AND farmerIpIsIpv6 = ${userIpIsIpv6}
        ORDER BY random()
        LIMIT '${leftNumber}'
        `))
        queryAsn.push(...await this._sqlite.all(`
        SELECT ${SELECT_COLUMN} FROM ${DBNAME} 
        WHERE (farmerAsn = '${userAsn}' AND farmerCity != '${userCity}')
        AND farmerIpIsIpv6 = ${userIpIsIpv6}
        ORDER BY random()
        LIMIT '${leftNumber}'
        `))
        queryAsnOrCity.push(...await this._sqlite.all(`
        SELECT ${SELECT_COLUMN} FROM ${DBNAME} 
        WHERE ((farmerAsn = '${userAsn}' AND farmerCity != '${userCity}') OR (farmerAsn != '${userAsn}' AND farmerCity = '${userCity}'))
        AND farmerIpIsIpv6 = ${userIpIsIpv6}
        ORDER BY random()
        LIMIT '${leftNumber}'
        `))
        leftNumber -= queryAsnOrCity.length
        query.push(...queryAsnOrCity)
        if (leftNumber === 0) return data

        
        queryCountry.push(...await this._sqlite.all(`
        SELECT ${SELECT_COLUMN} FROM ${DBNAME} 
        WHERE (farmerAsn != '${userAsn}' AND farmerCity != '${userCity}' AND farmerCountry = '${userCountry}')
        AND farmerIpIsIpv6 = ${userIpIsIpv6}
        ORDER BY random()
        LIMIT '${leftNumber}'
        `))
        leftNumber -= queryCountry.length
        query.push(...queryCountry)
        if (leftNumber === 0) return data


        queryAll.push(...await this._sqlite.all(`
        SELECT ${SELECT_COLUMN} FROM ${DBNAME} 
        WHERE (farmerAsn != '${userAsn}' AND farmerCity != '${userCity}' AND farmerCountry != '${userCountry}')
        AND farmerIpIsIpv6 = ${userIpIsIpv6}
        ORDER BY random()
        LIMIT '${leftNumber}'
        `))
        leftNumber -= queryAll.length
        query.push(...queryAll)
        if (leftNumber === 0) return data


        data.farmerEnough = false
        return data
    }

    isIpv6(ip){
        return !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(ip)
    }

}