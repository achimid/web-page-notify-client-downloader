const fs = require('fs')
const translate = require('google-translate-open-api').default

const SUBTITLE_PART = 9

const REGEX_REMOVE = [
    {old: '\\N', neww: ' '},
    {old: '\\i0}', neww: ''},
    {old: '{\\i1}', neww: ''},
    {old: '<i>', neww: ''},
    {old: '</i>', neww: ''},
    {old: '<b>', neww: ''},
    {old: '</b>', neww: ''},
    {old: '{\\an8}', neww: ''},
    {old: '{\\fad(859,521)}', neww: ''},    
]

const replaceEspecialChars = (d) => {
    let value = d
    for (const rg of REGEX_REMOVE) { value = value.split(rg.old).join(rg.neww) }
    return value
}

const replaceLastPart = (newPart, string) => {
    const parts = string.split(',')

    if (parts === -1)
        return string
        
    const primeiraPart = parts.splice(0, SUBTITLE_PART).join(',')
    return primeiraPart + ',' + newPart
}

const getLastPart = (string) => {
    const parts = string.split(',')

    if (parts === -1)
        return string
    
    let ultimaPart = parts.splice(SUBTITLE_PART, parts.length).join(',')
    return ultimaPart
}

const extractSubtitle = async (path) => {
    await require("child_process").execSync(`sh ${process.cwd()}/scripts/strExtract.sh ${path}`)
    return Promise.resolve()
}

const joinSubtitle = async (path) => {
    await require("child_process").execSync(`sh ${process.cwd()}/scripts/strJoin.sh ${path}`)
    return Promise.resolve()
}

const translateFile = async (inputFile, outputFile) => {
    const fileContent = fs.readFileSync(inputFile, 'utf8')

    const lines = fileContent.split('\n')

    const dialoguesLines = lines.filter(l => l.indexOf('Dialogue') == 0)
    
    const dialogues = dialoguesLines
        .map(getLastPart)
        .map(replaceEspecialChars)

    let translations = await translate(dialogues, {tld: "cn", from: "en", to: "pt"})
    translations = translations.data[0]

    const dialoguesMap = dialogues.map((original, index) => {
        const translated = translations[index][0][0][0]
        const line = dialoguesLines[index]
        return {line, original, translated}
    })

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index]
        
        const finded = dialoguesMap.filter(m => m.line === line)
        const hasLine = finded.length > 0
        
        if (hasLine) {
            const map = finded[0]
            lines[index] = replaceLastPart(map.translated, map.line)
        }
    }

    const output = lines.join('\n')
    fs.writeFileSync(outputFile, output)    

}

// const path = '/home/lourran/Downloads/tmp'
// const input = `${path}/[HorribleSubs] Infinite Dendrogram - 10 [1080p].srt`
// const output = `${path}/[HorribleSubs] Infinite Dendrogram - 10 [1080p].srt`

// extractSubtitle(path)
//     .then(() => translateFile(input, output))
//     .then(() => joinSubtitle(path))

module.exports = {
    translateFile,
    extractSubtitle,
    joinSubtitle
}