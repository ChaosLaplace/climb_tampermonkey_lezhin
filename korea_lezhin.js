// ==UserScript==
// @name         Korea Manhua
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Chao
// @match        https://www.lezhin.com/ko*
// @icon         https://www.google.com/s2/favicons?domain=bookwalker.com.tw
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require      https://unpkg.com/jszip@3.5.0/dist/jszip.min.js
// @resource     css https://raw.githubusercontent.com/eternalphane/UserScripts/master/18comic%20Downloader/overlay.css
// @resource     html https://raw.githubusercontent.com/eternalphane/UserScripts/master/18comic%20Downloader/overlay.html
// @grant        GM_getResourceText
// @grant        GM.getResourceText
// @grant        GM_addStyle
// @grant        GM.addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(async() => {
    'use strict';
    console.log('use Tampermonkey Plugin by ChaosLaplace');

    GM.addStyle(await GM.getResourceText('css'));
    const overlay = document.createElement('div');
    overlay.id = 'dl-overlay';
    overlay.innerHTML = await GM.getResourceText('html');
    overlay.hidden = true;
    document.body.appendChild(overlay);
    const circle = overlay.querySelectorAll('circle')[1];
    const number = overlay.querySelector('span');
    const msg    = overlay.querySelector('h2');
    const updateProgress = (percent, text) => {
        circle.style.strokeDasharray = `${percent} 100`;
        number.innerText = Math.round(percent);
        text != undefined && (msg.innerText = text);
    };
    // 建立下載按鈕
    const bt     = document.createElement('span');
    bt.innerHTML = '<a href="#" id="bl_download" class="bl_download">下載</a>';
    bt.style     = "position: absolute; z-index: 1; top: 0; right: 0; width: 100%; min-height: 100%; padding-top: 500px; font-size: 45px; font-weight: 1000;";
    document.querySelector('#contents-wrapper').appendChild(bt);

    $('.bl_download').click( async (e) => {
        e.preventDefault();

        updateProgress(0, 'Downloading(下載中)...');
        const manhuaName = document.getElementsByClassName("vh__title")[0].innerText;

        const zip = new JSZip;
        var total = $('#scroll-list div:last-child').last().attr('data-cut-index');
        var img_temp = 1, lastScreen, currentSreen, imgEq = 0, src, srcList = [];

        do {
            lastScreen   = $('#scroll-list div:last-child').last().attr('data-cut-status');
            currentSreen = $('#scroll-list div').eq(img_temp).attr('data-cut-status');

            await sleep(100);

            if ( currentSreen == "success" ) {
                src = $('#scroll-list .cut img').eq(imgEq).attr('src');
                srcList.push(src);

                await zip.file(img_temp + '.png', getBase64(src, 'src -> ' + img_temp));

                img_temp++;
                if ( imgEq < 2) {
                    imgEq++;
                }
            }
        } while ( lastScreen != "success" );

        save(
            await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 },
                mimeType: 'application/vnd.comicbook+zip'
            }, (meta) => updateProgress(meta.percent)),
            manhuaName+'.zip'
        );
        overlay.hidden = true;
    });
})();

async function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}

const save = (blob,filename) => {
    console.log([blob,filename]) ;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
};

async function getBase64(imgUrl, imgName) {
    const img = new Image;
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imgUrl;
    await new Promise((resolve, reject) => (img.onload = resolve, img.onerror = reject));
    const canvas = document.createElement('canvas');
    canvas.width  = img.width;
    canvas.height = img.height;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, img.width, img.height)
    console.log(imgName);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}
