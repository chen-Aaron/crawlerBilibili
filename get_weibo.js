var request = require( 'request' );
var cheerio = require( 'cheerio' );

var nodemailer = require('nodemailer');

var mysql = require( './toMysql.js' );

var mail = require( './send_email.js' );

var schedule = require ( 'node-schedule' );

var get_weibo=function( config ){

	this.emotion_url = config.emotion_url;//获取微博是否消极接口地址
	this.WeiBoUrl = config.WeiBoUrl; //获取微博内容地址
	this.getContent = config.getContent; //获取微博内容地址参数
	this.weibo = null; //存零时微博内容
	this.weibos=[]; //存所以微博数据
	this.weiboContents=[]; //过度微博内容
	this.userid = config.userid; //微博用户id
	this.containerid = config.containerid; //微博用户特定id
	this.mailconfig = config.mailconfig ; //微博报警邮箱
};
// 获取用户微博聚体情况
get_weibo.prototype.getweiBoContent = function( ){
	this.getContent.value = this.userid;
	this.getContent.containerid = this.containerid;
	this.WeiBoUrl = this.WeiBoUrl+'?sudaref=login.sina.com.cn&retcode='+this.getContent.retcode+'&type='+this.getContent.type+'&containerid='+this.containerid+'&page='+this.getContent.page+'&value='+this.getContent.value;
	var option = {
		url:this.WeiBoUrl,
	};
	var that = this;
	request( option , function(  error , response , body  ){  

		if( !error && response.statusCode==200 ){
			var Index;
			body = JSON.parse( body );
			body.cards.forEach( function( item ){
				if( item['mblog']!=null ){

					var $ = cheerio.load( item.mblog.text );
					$('a').remove();
					that.weibo={
							c_nickname: item['mblog']['user']['screen_name'] ,
							c_content: $.text(),
							c_time:item.mblog.created_at,
							c_contentid:parseFloat(item.mblog.id),
							c_userid:that.userid,
							c_sourceurl:item.scheme,
						};
					that.weibos.push( that.weibo );
				}
			} );
			that.get_mysqlweibo( that.userid , that.weibos );			
		}
		
	} );
};

// 获取用户微博情绪
get_weibo.prototype.get_emotion = function ( Index , length ){
	var url = this.emotion_url+encodeURI( this.weibos[Index].c_content );
	var emotivonThat = this;
	request( url , function( error , response , body ){ 

		if( !error && response.statusCode==200 ){
			body = JSON.parse( body );
			emotivonThat.weibos[Index].c_positive = body.positive;
			emotivonThat.weibos[Index].c_negative = body.negative;
			emotivonThat.weiboContents.push( emotivonThat.weibos[Index] );
			if( body.negative>0.8 ){
				try{
					emotivonThat.weiboWarnning( emotivonThat.weibos[Index] );
				}
				catch( e ){
					console.log( e );
				}
			}

			if( emotivonThat.weiboContents.length == length ){

				console.log( mysql.InsertMysqlWeibo( emotivonThat.weiboContents ) );
			}
		}
	} );
};

// 读取微博数据信息
get_weibo.prototype.get_mysqlweibo = function( userid , weibos ){
	var sql = 'SELECT c_content,c_time from db_weibocontent where c_userid = '+userid+' order by c_contentid DESC limit 10';
	var mysqlWeiboThat = this;
	mysql.MysqlQuery( sql , function( result ){ 
		var length = mysqlWeiboThat.weibos.length;

		if( result.length ){
			var index = mysqlWeiboThat.judgeweibo( weibos , result );

				if( index!=-1|index!=0 ){
					mysqlWeiboThat.weibos = mysqlWeiboThat.weibos.slice( 0 , index );
					mysqlWeiboThat.weibos.forEach( function( aItem , aIndex ){
						( function( Index , length ){  

							mysqlWeiboThat.get_emotion( Index , length );
								
						} )( aIndex , length );
					} );

				}
			}
			else{
				mysqlWeiboThat.weibos.forEach( function( aItem , aIndex ){
					( function( Index , length ){  

						mysqlWeiboThat.get_emotion( Index , length );
							
					} )( aIndex , length );
				} );
			}
			
	} );

};

// 判断是否为最新微博
get_weibo.prototype.judgeweibo = function( weibos , mysqlweibo ){

	var index = -1;
	var judge = mysqlweibo[0].c_contentid ;
	for( var i=0 ; i<weibos.length; i++ ){
		if( weibos[i].c_contentid == judge ){
			index = i;
			break;
		}
	};

	return index;
};

// 针对消极指数过高微博发出警告
get_weibo.prototype.weiboWarnning = function( weibo ){
	this.mailconfig.text = '系统检测到这篇微博负面情绪高达' + ( weibo.c_negative*100 ).toFixed(2)+'%。情况紧急刻不容缓。' ;
	this.mailconfig.html = '<p>系统检测到这篇微博负面情绪高达' + ( weibo.c_negative*100 ).toFixed(2)+'。情况紧急刻不容缓。</p>详情地址<a href="'+weibo.c_sourceurl+'" >没时间解释了</a>' ;

	var email = new  mail.creatEmail( this.mailconfig );
 	email.sendMail();
	// console.warn( weibo );
}

// 配置爬去数据用户列表
var items=[ {  userid:'1259110474' , containerid:'1076032089042141' , username :'赵丽颖' },
		   {  userid:'2089042141' , containerid:'1076031259110474' , username :'杨旭文' }
 ];


// http://weibo.com/1259110474/EwakUctIF?from=page_1006051259110474_profile&wvr=6&mod=weibotime&type=comment

// https://m.weibo.cn/status/EwakUctIF?mblogid=EwakUctIF&amp%3Bluicode=10000011&amp%3Blfid=1076031259110474&amp%3Bfeaturecode=20000180&retcode=6102

// 执行函数
items.forEach( function( item ){
	config = {
		userid:item.userid,
		containerid:item.containerid,
		emotion_url:'https://api.prprpr.me/emotion/wenzhi?password=DIYgod&text=',
		getContent:{
			retcode:'6102',
			type:'uid',
			page:1
		},
		WeiBoUrl:'https://m.weibo.cn/container/getIndex',
		mailconfig:{
			title:'微博监测',
			toWhom:'someones email',
			text:'content',
			html:'<h3>content</h3>',
		},};
	var weibo1 = new get_weibo( config );
	weibo1.getweiBoContent();
} );

