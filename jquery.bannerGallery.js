/* ------------------------------------------------------------------------
バナーギャラリー jQuery版 ver.1.1
    サイズ自動調整、キャプション表示、サムネールorビュレット表示、画像リンク設定
    Copyright (c) 2012, Matsumoto.JS All rights reserved.

【使用方法】（なるべく<head>タグ内にて）
<script src="js/jquery.min.js" type="text/javascript"></script> 
<script src="js/jquery.bannerGallery.js" type="text/javascript"></script>
<script language="JavaScript" type="text/javascript">
$(document).ready( function() {
    $("#testSlide").bannerGallery({interval:5, duration:0.5});
});
</script>
<div id="testSlide">
  <div id="image-container"></div><!-- イメージ表示部 -->
  <div id="text-container"></div><!-- テキスト表示部 -->
  <ul id="thumb-container"><!-- サムネール表示部 -->
    <!--<li>サムネールが挿入されます</li>-->
  </ul>
</div>

【パラメータの説明】
以下の情報を任意に指定します（上記書式を参考に）
    scaling: 画像のスケール調整（初期値:'fill','fit','none'）
    imageId: スライドショーを表示するブロックのID
    duration: フェードの時間を秒で指定（画像の切替え時間）
    thmScaling: サムネールのスケール調整（初期値:'fit','fill','none'）
    thmDarkness: アクティブでないサムネール暗さ(0.1 から 0.9)
    thmDuration: サムネールフェードの時間を秒で指定
    textId: テキストを表示する際のテキストブロックのID
        （指定しない、または空の場合はテキストを表示しません）
    interval: 自動切り替えの間隔を秒で指定（初期値:0=再生しない）    
    spinner: スピナー（ローディングアニメ）画像を指定    
    json: データ構造をJSONで指定
※スケールのfillは縦横いずれかをいっぱいに、fitは画面内にすべて収まるようにスケーリングします

【JSONの説明】
json: {
    items:[{
        "url": "path-to-image.jpg",    //画像URL:相対パスの場合HTMLから/01.jpg
        "link": "http://url-to-link",  //画像リンクを設定する場合のURL,オプション
        "target": "_blank",            //画像リンクのウィンドウターゲット,オプション
        "description": "text-description", //説明文,オプション
        "thumb": "path-to-thumbnail.png" //サムネール画像URL,オプション
        "thumb_base": "path-to-thumbnail.png" //サムネール画像背景URL,オプション
    }]
}
 ------------------------------------------------------------------------ */

(function($) {

    $.fn.imageLoadAndCall = function (url,callback) {
        if (this.complete) {
            callback.call(this);
            return this;
        }
        var suffix = '';
        if ($.browser.msie) { //IE
            suffix = '?rd='+(new Date()).getTime();//fetch every time
            if (url==null && this.data('fromJson'))
                url = this.attr('src');//URL
        }
        this.load(function() {callback.call(this);});
        if (url) this.attr('src',url+suffix); 
        //IEは後でセットしないとイベント出ない！&& IEは戻るボタンなどではイベント出ない！
        return this;
    };

    $.fn.bannerGallery = function (options) {
        var settings = {
            scaling : "fit", // or fill, none
            imageId : "image-container",
            duration : 1.0,
            thmScaling  : "fill", // or fit, none
            thmDarkness : 0.4,
            thmDuration : 0.4,
            textId : "",
            interval : 0,
            json : null
        };
        if (options) $.extend(settings,options);
        settings.duration = settings.duration * 1000;
        settings.thmDuration = settings.thmDuration * 1000;
        settings.interval = settings.interval * 1000;
        
        var prepare = {
            _scaleAndLayout: function ($img, scaling, width, height) {
                var ratioX, ratioY, scale, newW, newH, orgW, orgH;
                orgW = $img.width();
                orgH = $img.height();
                ratioX = width / orgW;
                ratioY = height / orgH;
                if (scaling === 'fit') {
                    scale = ratioX < ratioY ? ratioX : ratioY;
                } else if (scaling === 'fill') {
                    scale = ratioX > ratioY ? ratioX : ratioY;
                } else {
                    scale = 1.0;
                }
                newW = parseInt(orgW * scale);
                newH = parseInt(orgH * scale);      
                $img.css({
                    "width": newW + "px",
                    "height": newH + "px",
                    "position": "absolute",
                    "top": (parseInt((height - newH) / 2)) + "px",
                    "left": (parseInt((width - newW) / 2)) + "px"
                }).attr({
                    "width": newW,
                    "height": newH
                });
            },
            //----- 1st
            createThumbnail: function ($img) {
                prepare._scaleAndLayout($img, settings.thmScaling, tW, tH);
                //Load slide image
                var $newImg = $imgContainer.find('img').eq($img.data('index'));

                //image src from a tag
                $newImg.data('index',$img.data('index'))
                    .css({'display':'none','border':'none'})
                    .width('auto').height('auto');
                if ($img.data('link')) {
                    var $alink = $('<a>');
                    $alink.attr('href',$img.data('link'));
                    if ($img.data('target'))
                        $alink.attr('target',$img.data('target'));
                    $newImg.before($alink).appendTo($alink);
                }
                $newImg.imageLoadAndCall($img.parent().attr('href'),
                    function () {
                        prepare.createSlide($newImg);
                    }
                );
                //Last image
                if ($img.data('last')) prepare.showThumbnail();
            },
            //----- 2nd
            createSlide: function ($newImg) {
                prepare._scaleAndLayout($newImg, settings.scaling, pW, pH);
            },
            //----- 3rd
            showThumbnail: function () {
                timer = setInterval(prepare._thumbEvent, settings.thmDuration);
            },
            _thumbEvent: function () {
                var $img = $thmContainer.find('img.targetImage').eq(currentIndex++);
                $img.fadeTo(settings.thmDuration,settings.thmDarkness);
                if ($img.data('index')==1) {
                    spinner.off();
                    effect.fadeIn(0);
                }
                if ($img.data('last')) {
                    clearInterval(timer);
                    currentIndex = 0;
                    prepare.complete();
                }
            },
            //----- Last
            complete: function () {
                $thmContainer.find('img.targetImage').each( function (index) {
                    $(this).click( function () {
                        if (settings.interval > 0) clearInterval(timer);
                        effect.fadeOut(currentIndex);
                        currentIndex = $(this).data('index');
                        effect.fadeIn(currentIndex);
                        if (settings.interval > 0) 
                            timer = setInterval(prepare._autoplayEvent, 
                                settings.interval);
                        return false;
                    }).hover( function () {
                        $(this).stop(true,true)
                            .fadeTo(settings.thmDuration,1.0);
                    }, function () {
                        if ($(this).data('index') != currentIndex) 
                            $(this).stop(true,true)
                                .fadeTo(settings.thmDuration,settings.thmDarkness);
                    });
                });
                 
                if (settings.interval > 0) {
                    timer = setInterval(prepare._autoplayEvent, settings.interval);
                }
            },
            _autoplayEvent: function () {
                var $img = $thmContainer.find('img.targetImage').eq(currentIndex);
                if ($img.data('index')==0 && $img.data('last')) {
                    settings.interval = 0;
                    clearInterval(timer);
                    return;
                }
                effect.fadeOut(currentIndex);
                if ($img.data('last')) currentIndex = 0;
                else currentIndex++;
                effect.fadeIn(currentIndex);
            }
        }
        //Effect
        var effect = {
            fadeIn: function (imgIndex) {
                var $thumbnail = $thmContainer.find('img.targetImage').eq(imgIndex);
                if ($txtContainer) {
                    var text = $thumbnail.data('description');
                    if (!text) text = $thumbnail.parent().attr('title');
                    if (!text) text = "";
                    $txtContainer.html(text);
                }
                $thumbnail.fadeTo(0,1.0);
                $imgContainer.find('img').eq(imgIndex)
                    .stop(true,true).fadeIn(settings.duration);
            },
            fadeOut: function (imgIndex) {
                $thmContainer.find('img.targetImage').eq(imgIndex)
                    .fadeTo(0,settings.thmDarkness);
                $imgContainer.find('img').eq(imgIndex)
                    .stop(true,true).fadeOut(settings.duration/3);//shorten
           }
        }
        var spinner = {
            on: function () {
                if (!settings.spinner) return;
                var $spn = $('<img>');
                $spn.addClass('spinner');
                $imgContainer.append($spn);
                $spn.imageLoadAndCall(settings.spinner,function () {
                    prepare._scaleAndLayout($spn, 'none', pW, pH);
                });
            },
            off: function () {
                if (!settings.spinner) return;
                var $spn = $imgContainer.find('img.spinner');
                $spn.fadeOut(settings.thmDuration);
            }
        }

        //Load data if json
        if  (settings.json) {
            var suffix = ''; // IE8以前ではサムネールもキャッシュさせない v1.1
            if ($.browser.msie) { 
                suffix = '?rd='+(new Date()).getTime();//fetch every time
            }
            var items = settings.json.items;
            for (var i = 0; i < items.length; i++) {
                var $li = $('<li>');
                //has thumb_base
                if (items[i].thumb_base) {
                    var $base = $('<img>').attr('src',items[i].thumb_base+suffix);
                    $li.append($base);
                }
                var $a = $('<a>');
                var $img = $('<img>');
                $a.attr('href',items[i].url);
                $img.attr('src',(items[i].thumb?items[i].thumb:items[i].url)+suffix)
                    .addClass('targetImage');
                if (items[i].description)
                    $img.data('description',items[i].description);
                if (items[i].link)
                    $img.data('link',items[i].link);
                if (items[i].target)
                    $img.data('target',items[i].target);
                $(this).find('ul').append($li);
                $li.append($a);
                $a.append($img);
            }
        }
        
        //Initialize
        var timer;
        var currentIndex = 0;
        var $imgContainer = $(this).find('#'+settings.imageId);
        var $thmContainer = $(this).find('ul li');
        var $txtContainer;
        if (settings.textId)
            $txtContainer = $(this).find('#'+settings.textId);

        var pW = $imgContainer.width(), pH = $imgContainer.height(),
            tW = $thmContainer.width(), tH = $thmContainer.height();
        
        if ($imgContainer.css('position') === 'static')
            $imgContainer.css({'position':'relative'});
        if ($thmContainer.css('position') === 'static')
            $thmContainer.css({'position':'relative'});

        $thmContainer.find('img.targetImage').last().data('last',true);
        $thmContainer.find('img.targetImage').each( function (index) {
            var $img = $('<img />');
            $img.hide();
            $imgContainer.append($img);
            $(this).data('index',index)
                   .css({'display':'none','border':'none'})
                   .width('auto').height('auto');
        });
        spinner.on();
        $thmContainer.find('img.targetImage').each(function (index) {
            $(this).imageLoadAndCall(null,
                function () {
                     prepare.createThumbnail($(this));
                }
            );
        });
    
        return this;
    }

}(jQuery));
