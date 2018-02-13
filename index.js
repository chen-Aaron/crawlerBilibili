const request = require('request');
const Fs = require('fs');

let url = 'https://api.bilibili.com/x/web-interface/dynamic/region?rid=$rid&jsonp=jsonp';

let rid = 4400;

let start = 3800

let list = [];

let queue = [];

for(let i=start;i<rid; i++ ){
    queue.push(getTid(i));
}

Promise.all(queue).then(()=>{
    read();
}).catch((e)=>{console.log(e)})

function getTid(num){
    return new Promise((resolve, reject) => {
        let path = url.replace('$rid', num);
        request(path, (err, res, data) => {
            console.log(num)
            data = JSON.parse(data);
            if(data.code === 0){
                list.push(num);
            }
            resolve();
        })

    })
}

function read(){
    Fs.readFile('./test.js', (err, data)=>{
        if (err) data = [];
        data = JSON.parse(data);
        list = list.concat(data);
        write(JSON.stringify(list));
    })
}

function write(content){
    Fs.writeFile('./test.js', content, function(e){
        if(e){
            console.log('write failed');
        } else {
            console.log('did it');
        }

    });
}

