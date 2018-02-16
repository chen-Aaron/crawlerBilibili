const request = require('request');

const Mysql = require('./toMysql.js');

let urls = 'https://api.bilibili.com/playurl?aid=$aid&page=1&quality=16&type=json&platform=html5';

class crawlerCid{

    constructor(urls, Mysql, request) {
        this._urls = urls;
        this._Mysql = Mysql;
        this._request = request;
        this._time = 0;
        this._list = [];
        this._infoList = [];
    }

    getVideoInfo() {

        this._Mysql.getAids((result) => {
            result.forEach((item)=>{
                this._list.push(this.getCid(item.aid));
            })

            this.setCid();
        })
    }

    setCid(){
        Promise.all(this._list).then(()=>{
            this.setInfo();
        })
    }

    getCid(aid){

        let url = this._urls.replace('$aid', aid);

        let option = {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
                'Cookie': 'fts=1473940063; pgv_pvi=2678871040; rpdid=olpilpiloodopqwosspqw; buvid3=84403169-6D95-4AEC-8638-6DDF7D6CD5A76142infoc; LIVE_PLAYER_TYPE=2; UM_distinctid=15e6b209c3a5d-0ba97c431d11e2-31637e01-fa000-15e6b209c3b96; biliMzIsnew=1; biliMzTs=null; LIVE_BUVID=058fab8a43e136e389822802ebd51c93; LIVE_BUVID__ckMd5=c71c089f4f655d33; sid=8honsw9x; finger=14bc3c4e; bsource=bdts'
            }
        };

        return new Promise((resolve, reject)=>{
            this._request(option, (err, res, body) => {
                try {
                    resolve();
                    console.log(url)
                    if (!err) body = JSON.parse(body);
                    if (err) {
                        console.log('its an get error');
                    } else if (body.result) {
                        this._time++;
                        let temp = {
                            accept_format: escape(body.accept_format), 
                            accept_quality: escape(JSON.stringify(body.accept_quality)), 
                            cid: escape(body.cid), 
                            durl: escape(JSON.stringify(body.durl)), 
                            fromview: escape(body.fromview), 
                            hit_ssd_sid: escape(body.hit_ssd_sid), 
                            img: escape(body.img), 
                            result: escape(body.result), 
                            seek_param: escape(body.seek_param), 
                            seek_type: escape(body.seek_type), 
                            aid: aid,
                            timelength: escape(body.timelength)
                        };

                        this._infoList.push(temp);
                    }


                } catch (e) {
                    console.log(e);
                }
            })
        })
        
    }

    setInfo(){
        this._Mysql.InsertVideoInfo(this._infoList, (err) => {
            if(err) {
                throw new Error('its a insert error')
            } else {
                this._Mysql.setAids(this._infoList, (err)=>{
                    if (err) {
                        new Error('its a update error');
                    } else {
                        console.log('success')
                    }
                });
            }
        })
    }

}

let crawler = new crawlerCid(urls, Mysql, request);

crawler.getVideoInfo();