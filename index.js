require('dotenv').config()

const SERVER_URL = process.env.SERVER_URL
const DOWNLOAD_FOLDER = process.env.DOWNLOAD_FOLDER

const socket = require('socket.io-client')(SERVER_URL);
const notifier = require('node-notifier');

const fs = require('fs')
const rimraf = require("rimraf");

const WebTorrent = require('webtorrent')
const client = new WebTorrent()

// ======= SOCKET EVENTS =============
socket.on('connect', () => console.info('Socket conectado ao servidor'))

socket.on('disconnect', () => console.info('Socket desconectado do servidor'))

socket.on('client_download', (data) => startDownload(data.url))


const startDownload = (magnetURI) => {
    if (!magnetURI) return
    
    client.add(magnetURI, (torrent) => {
        const obj = { client, torrent, pathNew: DOWNLOAD_FOLDER }
        startProgressLog(obj)
            .then(onStartDownload)
            .then(whenTorrentDone)
            .then(onFinishDownload)
            .then(moveFileFromFileSystem)
            .then(removeTorrentFromClient)
            .then(removeFileFromFileSystem)
            .then(stopProgressLog)
            .catch((err) => console.error('Erro ao efetuar download', err))
    
    })
}

const moveFileFromFileSystem = (wrapObj) => new Promise((resolve, reject) => {
    console.info('Movendo arquivos...')
    fs.rename(wrapObj.torrent.path, wrapObj.pathNew + wrapObj.torrent.infoHash, (err) => err ?  reject(err) : resolve(wrapObj))
})

const removeTorrentFromClient = (wrapObj) => new Promise((resolve, reject) => {
    console.info('Removendo torrent do downloader...')
    wrapObj.client.remove(wrapObj.torrent.infoHash, (err) => err ?  reject(err) : resolve(wrapObj))
})

const removeFileFromFileSystem = (wrapObj) => new Promise((resolve, reject) => {
    console.info('Removendo arquivos...')
    rimraf(wrapObj.torrent.path, (err) => err ?  reject(err) : resolve(wrapObj))
})

const whenTorrentDone = (wrapObj) => new Promise((resolve, reject) => {
    wrapObj.torrent.on('done', () => {
        console.info('Download do torrent finalizado...')
        resolve(wrapObj)
    })
})

const startProgressLog = async (wrapObj) => {
    wrapObj.progressLog = setInterval(() => console.log(`Progresso [${(wrapObj.torrent.progress * 100).toFixed(0)}%] [${bytesToSize(wrapObj.torrent.downloadSpeed)}/s] [${bytesToSize(wrapObj.torrent.uploadSpeed)}/s]`), 3000)
    wrapObj.startTime = Date.now()
    return Promise.resolve(wrapObj)
}

const onStartDownload = async (wrapObj) => {
    wrapObj.torrent.files.map((file) => {
        console.info('Iniciando download:', file.path)        
        sendNotificationDesktop({ title: 'Iniciando download', message: file.path })
    })
    return Promise.resolve(wrapObj)
}

const onFinishDownload = async (wrapObj) => {
    wrapObj.torrent.files.map((file) => {
        console.info('Download concluido:', file.path)
        console.info(`Download time: ${msToFormatedTime(Date.now() - wrapObj.startTime)}s`)
        sendNotificationDesktop({ title: 'Download concluido', message: file.path })
    })
    return Promise.resolve(wrapObj)
}

const stopProgressLog = async (wrapObj) => {
    clearInterval(wrapObj.progressLog);
    delete wrapObj.progressLog
    return Promise.resolve(wrapObj)
}


const sendNotificationDesktop = ({title, message}) =>
    notifier.notify({
        title: title,
        message: message,
        sound: true,
        wait: false
    })
 
function msToFormatedTime(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}
    





