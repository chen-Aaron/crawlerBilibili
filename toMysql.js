var mysql = require('mysql');

const moment = require('moment');

//数据库配置-本地mysql数据库
// var config={
//   host     : 'localhost',
//   user     : 'root',
//   password : 'zhuanyon',
//   database : 'myapp',
  
// };
//阿里云mysql数据库
var config={
  host	   : '47.91.233.62',
  user     : 'root',
  password : 'zhuanyon',
  database : 'bilibili',
  
};

// 连接mysql数据库
function connectMysqlStart( config ){
	var connection = mysql.createConnection( config );

	return connection;


};
// 断开数据库连接
function connectMysqlEnd( connection ){
	connection.end();
};

// 数据库查询
function MysqlQuery( query , callback ){
	var connection = mysql.createConnection( config );
	var aReslut;
	
	connection.query( query , function( err , results , fields ){ 
		if( err ) throw err ; 

		aReslut =  results;
		callback( aReslut );

	 } );

	connection.end();

}

function InsertError(tid, pages, callback){
	var connection = mysql.createConnection(config);

	var sql = "insert into error (tid, pg) VALUES ";
	var values = '';
	values += `('${tid}', '${pages}')`;
	sql = sql + values;
	connection.query(sql, function (error, results, fields) {
		if (error) throw error;
		callback(fields);
	});
	connection.end();
	return true;
}

function InsertAid(Aids, callback){
	var connection = mysql.createConnection(config);

	var sql = "insert into video (aid, tid, tname, pic, title, attribute, duration, rights, dynamic, play, favorites, video_review, createtime, description, mid, author, face) VALUES ";
	var values = '';
	Aids.forEach(function (aItem) {
		values += `,('${aItem.aid}', '${aItem.tid}', '${aItem.tname}', '${aItem.pic}', '${aItem.title}', '${aItem.attribute}', '${aItem.duration}', '${aItem.rights}', '${aItem.dynamic}', '${aItem.play}', '${aItem.favorites}', '${aItem.video_review}', '${aItem.createtime}', '${aItem.description}', '${aItem.mid}', '${aItem.author}', '${aItem.face}')`;
	});
	values = values.replace(',', '');
	sql = sql + values;
	connection.query(sql, function (error, results, fields) {
		if (error) callback(error);
		callback();
	});
	connection.end();
	return true;
}

function InsertVideoInfo(info, callback){
	var connection = mysql.createConnection(config);

	var sql = "insert into videoInfo (accept_format, accept_quality, cid, durl, fromview, hit_ssd_sid, img, result, seek_param, seek_type, timelength, time, aid) VALUES ";
	var values = '';
	let time = moment().format('YYYY-MM-DD HH:mm:ss');
	info.forEach(function (aItem) {
		values += `,('${aItem.accept_format}', '${aItem.accept_quality}', '${aItem.cid}', '${aItem.durl}', '${aItem.fromview}', '${aItem.hit_ssd_sid}', '${aItem.img}', '${aItem.result}', '${aItem.seek_param}', '${aItem.seek_type}', '${aItem.timelength}', '${time}', '${aItem.aid}')`;
	});
	values = values.replace(',', '');
	sql = sql + values;
	console.log(sql)
	connection.query(sql, function (error, results, fields) {
		if (error) callback(error);
		callback();
	});
	connection.end();
	return true;
}

// 获取cid,查看status状态
function getAids(table, callback){
	var connection = mysql.createConnection(config);

	let sql = `select aid from ${table} where status = 1 order by id ASC limit 200`;

	connection.query(sql, (err, result, fields) => {
		if(err) callback(err);
		callback(result);
	})
	connection.end();
	return true;

}

// 重置video信息状态
function setAids(aids, table, callback){
	var connection = mysql.createConnection(config);

	let sql = `UPDATE ${table} set status=0 where `;

	let val = '';

	aids.forEach((aItem)=>{
		val+=` or aid = ${aItem.aid}`;
	})

	val = val.replace('or', '');

	sql += val; 

	console.log(sql)

	connection.query(sql, (err, result, field)=>{
		if(err) callback(err);
		callback()
	})
	connection.end();
	return true;
}

function dealError(errors, table, callback){
	var connection = mysql.createConnection(config);

	let sql = `UPDATE ${table} set status=2 where `;

	let val = '';

	errors.forEach((aItem) => {
		val += ` or aid = ${aItem.aid}`;
	})

	val = val.replace('or', '');

	sql += val;

	console.log(sql)

	connection.query(sql, (err, result, field) => {
		if (err) callback(err);
		callback()
	})
	connection.end();
	return true;
}



function InsertMysqlWeibo (  weibos ){
	var connection = mysql.createConnection( config );

	var sql = "insert into db_weibocontent(c_content,c_time,c_nickname,c_positive,c_negative,c_contentid ,c_userid , c_sourceurl) VALUES ";
	var values = '';
	weibos.forEach( function( aItem ){ 
		values+=",('"+aItem.c_content+"','"+aItem.c_time+"','"+aItem.c_nickname+"','"+aItem.c_positive+"','"+aItem.c_negative+"','"+aItem.c_contentid+"','"+aItem.c_userid+"','"+aItem.c_sourceurl+"')";
	} );
	values = values.replace( ',' , '' );
	sql = sql + values ;
	connection.query( sql , function (error, results, fields) {
	  if (error) throw error;

	});
	connection.end();
    return true;

}

// 方法暴露
module.exports.connectMysqlStart=connectMysqlStart;
module.exports.MysqlQuery=MysqlQuery;
module.exports.InsertMysqlWeibo=InsertMysqlWeibo;
module.exports.InsertAid = InsertAid;
module.exports.InsertError = InsertError;
module.exports.getAids = getAids;
module.exports.setAids = setAids;
module.exports.InsertVideoInfo = InsertVideoInfo;
module.exports.dealError = dealError;

