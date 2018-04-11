const request = require('request');

const Mysql = require('./toMysql.js');

const config = require('./config/index.js');

const fs = require('fs');

const sax = require('sax');

const zlib = require('zlib');

const Redis = require('ioredis');

// const redis = new Redis(config)

// const through2 = require('through2');

let table = ['db_video1', 'db_video2', 'db_video3', 'db_video4', 'db_video5', 'db_video6', 'db_video7', 'db_video8', 'db_video9', 'db_video10', 'db_video11', 'db_video12', 'db_video13', 'db_video14', 'db_video15', 'db_video16', 'db_video17', 'db_video18'];

class CrawlerXml{

    constructor(Mysql, request, table){

        this._Mysql = Mysql;

        this._request = request;

        this._tables = table;

        this._queue = [];

        this._errorList = [];

        this._update = [];
    }

    // run(){
    //     this.getReady();
    // }

    run(){
        if ( this.getTable() ){

            fs.exists(`./${this._currentTable}`, (res)=>{
                if (res) 
                    this.getList()
                else
                    this.mkdir()
                
            })


        }
        
    }

    mkdir(){
        fs.mkdir(`./${this._currentTable}`, (e) => {
            if (!e) {
                console.log(`it's fine`);

                this.getList();

            } else {
                console.log(`it's wrong`);
            }
        })
    }

    getTable(){
        if(this._tables.length > 0){

            let table = this._tables.splice(0, 1);

            this._currentTable = table[0];

            return true

        }
        return false;
    }

    getList(){

        this._Mysql.getXmlList(this._currentTable, (result) => {

            if (result.length > 0) {

                // result = result.slice(0,1);

                result.forEach((item)=>{
                    this._queue.push(this.saveXml(item))
                })

                Promise.all(this._queue).then((res)=>{
                    this._queue = [];

                    this.setDataXml();

                    console.log(res);
                })

            } else {

                this.run();
                
                console.log('fail')

            }

        })

    }

    saveXml(item){

        return new Promise((resolve, reject)=>{

            let url = unescape(item.cid);

            let self = this;

            let option = {
                url: url,
                timeout: 2000
            };

            let cid = url.replace('https://comment.bilibili.com/', '');

            this._request.get(option).pipe(zlib.InflateRaw()).pipe(fs.createWriteStream(`./${self._currentTable}/${cid}`)).on('finish', function (err) {

                self._update.push(item.id);

                resolve('finish');

            }).on('error', () => {

                self._errorList.push(item);

                resolve('error');

            });;

        });

    }

    writeFiles(self, resolve, cid, item){

        fs.createWriteStream(`./${self._currentTable}/${cid}`).on('finish', function (err) {

            self._update.push(item.id);

            resolve('finish');

        }).on('error', () => {

            self._errorList.push(item);

            resolve('error');

        });

    }

    setDataXml(){

        if( this._update.length ){

            this._Mysql.upDataXml(this._update, this._currentTable, (err)=>{

                if(!err){

                    this._update = [];

                    this.getList();

                }

            })

        }

        if (this._errorList.length) {

            this._Mysql.dealXmlErr(this._errorList, this._currentTable, (err) => {

                if (!err) {

                    this._errorList = [];

                    console.log('deal errors');

                }

            })

        }
        
    }


}

let crawlers = new CrawlerXml(Mysql, request, table);

crawlers.run();


























// let option = {
//     uri: 'https://comment.bilibili.com/31878592.xml',
//     method: "GET",
//     headers: {
//         'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
//         'Cookie': 'fts=1473940063; pgv_pvi=2678871040; rpdid=olpilpiloodopqwosspqw; buvid3=84403169-6D95-4AEC-8638-6DDF7D6CD5A76142infoc; LIVE_PLAYER_TYPE=2; biliMzIsnew=1; biliMzTs=null; LIVE_BUVID=058fab8a43e136e389822802ebd51c93; LIVE_BUVID__ckMd5=c71c089f4f655d33; sid=8honsw9x; UM_distinctid=162181823ec29a-00b7c72c23f276-32667b04-fa000-162181823ed212; finger=14bc3c4e; DedeUserID=28225928; DedeUserID__ckMd5=212148b282e4faa9; SESSDATA=a6086026%2C1524643782%2Ca3e611da; bili_jct=57e3a8531f810d1ac4c24947cfadbb50; from=sj; pos=67; _dfcaptcha=3dfb0ce978af2781dfb8c37de4ce3360',
//         "content-encoding": "gzip, deflate"
//     }
// };

// function writes(line, _, next) {
//     // var iconvs = new iconv('UTF-8', 'ISO-8859-1');
//     let str = iconv.decode(line, 'UTF-8')
//     this.push(str);
//     console.log(str);
//     next();
// }

// function ends(done) {
//     done();
// }

// let stream = through2(writes, ends);


// var readerStream = fs.createReadStream('test.xml');
// var data='';
// // readerStream.setEncoding('uCS2');
// readerStream.setEncoding('UTF8');

// readerStream.on('data', function (chunk) {
//     data += chunk;
// });

// readerStream.on('end', function () {
//     console.log(data);
// });

// var options = {  
//         hostname: 'comment.bilibili.com',  
//         port: 443, //端口号 https默认端口 443， http默认的端口号是80  
//         path: 'https://comment.bilibili.com/31878592.xml',  
//         method: 'GET',  
//         // headers: {  
//         //     "Connection": "keep-alive",  
//         //     "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",  
//         //     "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"  
//         // }//伪造请求头  
//     };  
  
//     var req = http.request(options, function (res) {  
  
//         var json = ""; //定义json变量来接收服务器传来的数据  
//         console.log(res.statusCode);  
//         //res.on方法监听数据返回这一过程，"data"参数表示数数据接收的过程中，数据是一点点返回回来的，这里的chunk代表着一条条数据  
//         res.on("data", function (chunk) {  
//             json += chunk; //json由一条条数据拼接而成  
//         })  
//         //"end"是监听数据返回结束，callback（json）利用回调传参的方式传给后台结果再返回给前台  
//         res.on("end", function () {  
//             console.log(json);  
//         })  
//     })  
// axios.get('https://www.biliplus.com/danmaku/31878592.xml').then((res)=>console.log(res))
// request(option).pipe(fs.createWriteStream('test.xml'));
// request(option, (err, response, body)=>{
//     // let str = iconv.decode(body, 'GBK');
//     fs.writeFile('test.xml', body, function(err){
//         console.log(err)
//     })
//     console.log(body)

// })

// fs.readFile('./test.xml', (err, res)=>{

//    console.log(res.toString());

// });
// request('https://comment.bilibili.com/31878592.xml').pipe(zlib.InflateRaw()).pipe(fs.createWriteStream('test.xml'))
// request('https://comment.bilibili.com/31878592.xml', (err, res, body)=>{
//     if(err) console.log(err);


//     var html = iconv.decode(new Buffer('<i><chatserver>chat.bilibili.com</chatserver><chatid>31878592</chatid><mission>0</mission><maxlimit>1000</maxlimit><state>0</state><real_name>0</real_name><source>e-r</source><d p="23.20800,1,25,16777215,1521438856,0,964575f,4398332330">竹板那么一拍呀</d><d p="36.40400,1,25,16777215,1521438869,0,964575f,4398332615">别的咱不夸</d></i>'), 'utf-8')


//     fs.writeFile('test.xml', html, function(err){
//         console.log(err)
//     })
// })