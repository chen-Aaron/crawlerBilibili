const request = require('request');

const Mysql = require('./toMysql.js');

let urls = 'https://api.bilibili.com/archive_rank/getarchiverankbypartion?jsonp=jsonp&tid=$tid&pn=$page';

let url = 'https://api.bilibili.com/archive_rank/getarchiverankbypartion?jsonp=jsonp&tid=183&pn=$page';

let tids = [181, 59, 152, 153, 28, 47, 25, 179, 157, 39, 156, 177, 184, 36, 65, 145, 158, 161, 124, 19, 22, 160, 127, 96, 26, 170, 54, 32, 173, 37, 175, 172, 176, 121, 27, 1, 119, 4, 86, 95, 75, 11, 83, 3, 17, 29, 85, 51, 146, 154, 23, 128, 5, 159, 98, 13, 162, 24, 30, 183, 20, 129, 82, 163, 76, 71, 137, 31, 21, 166, 130, 147, 167, 185, 168, 155, 187, 182, 174, 138, 180, 169, 164, 33, 122, 136, 165, 171, 126, 178, 131];

let tid = [];

let page = 1;

function getNext(){
    tid = tids.splice(0,1);
    page = 1;
    if(tid.length>0){

        url = urls.replace('$tid', tid[0]);
        getAids();

    }
}

function helpError(tid, pg){
    Mysql.InsertError(tid, pg, ()=>{
        console.log('handle error!');
        getNext();
    });
}

function getAids(){

    let path = url.replace('$page', page);

    request(path, { timeout: 1500 }, (err, res, body) => {
        try {
            if(!err) body = JSON.parse(body);

            // throw new Error('Unexpected token u in JSON at position 0');

            let list = [];

            if (err) {
                helpError(tid[0], page);

                console.log('its an get error');
            } 
            else if (body.code === 0 && body.data.archives.length>0) {
                body.data.archives.forEach((item) => {
                    let temp = {
                        aid: escape(item.aid),
                        tid: escape(item.tid),
                        tname: escape(item.tname),
                        pic: escape(item.pic),
                        title: escape(item.title),
                        attribute: escape(item.attribute),
                        duration: escape(item.duration),
                        rights: escape(JSON.stringify(item.rights)),
                        dynamic: escape(item.dynamic),
                        play: escape(item.play),
                        favorites: escape(item.favorites),
                        video_review: escape(item.video_review),
                        createtime: escape(item.create),
                        description: escape(item.description),
                        mid: escape(item.mid),
                        author: escape(item.author),
                        face: escape(item.face),
                    }

                    list.push(temp);
                })

                Mysql.InsertAid(list, (field) => {
                    if (field !== undefined) helpError(tid[0], page);
                    console.log(page);
                    page++;
                    getAids();
                })
            } else{
                helpError(tid[0], page);
            };

        } catch (e) {
            helpError(tid[0], page);
            console.log('its an error')
            console.log(e);
        }

    })
}

getNext();