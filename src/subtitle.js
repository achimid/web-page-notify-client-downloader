const fs = require('fs')
const translate = require('google-translate-open-api')

const SCRIPT_PATH = `${process.cwd()}/scripts`
const SUBTITLE_PART = 9

const REGEX_REMOVE = [
    {old: '\\N', neww: ' '},
    {old: '\\i0}', neww: ''},
    {old: '{\\i1}', neww: ''},
    {old: '<i>', neww: ''},
    {old: '</i>', neww: ''},
    {old: '<b>', neww: ''},
    {old: '</b>', neww: ''},
]

const fixPontuation = (str) => {
    return str.replace(/[&\/\\#,+()$~%.'":*?!<>{}]/g, '$& ').replace(/(\.\s){3}/g, '... ').replace(/\?\s\!\s/g, '?! ').replace(/\!\s\?\s/g, '!? ').replace(/\s{2}/g, ' ').replace(/\s+(?=[^{]*\})/g, "").trim()
}

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
    console.info('Executando script de de extração de legenda...')  
    await require("child_process").execSync(`sh ${SCRIPT_PATH}/strExtract.sh ${path} ${SCRIPT_PATH}/bin`)
    console.info('Execução do script finalizada')
    return Promise.resolve()
}

const joinSubtitle = async (path) => {
    console.info('Executando script de inclusão de legenda...')  
    await require("child_process").execSync(`sh ${SCRIPT_PATH}/strJoin.sh ${path} ${SCRIPT_PATH}/bin`)
    console.info('Execução do script finalizada')
    return Promise.resolve()
}

const readSubtitleFile = (inputFile) => {
    console.info('Lendo arquivo de legenda...')

    const fileContent = fs.readFileSync(inputFile, 'utf8')
    const lines = fileContent.split('\n')
    return lines
}

const getSSADialogues = (lines) => {
    
    const dialoguesLines = lines.filter(l => l.indexOf('Dialogue') == 0)
    const dialogues = dialoguesLines.map(getLastPart).map(replaceEspecialChars)
    
    return {dialoguesLines, dialogues}
}

const translateEnToPt = async (dialogues) => {
    const options = {tld: "cn", from: "en", to: "pt"}
    const translationResponse = await translate.default(dialogues, options)
    const content = translationResponse.data[0]
    const translations = translate.parseMultiple(content)
    const fixedTranslations = translations.map(fixPontuation)

    return fixedTranslations 
}

const writeSubtitleFile = (lines, outputFile) => {
    fs.writeFileSync(outputFile, lines.join('\n'))    
}

const getEditedFileContent = (lines, dialoguesMap) => {
    return lines.map(line => {
        const finded = dialoguesMap.filter(m => m.line === line)
        const hasLineTranslated = finded.length > 0

        if (!hasLineTranslated) return line
        
        const firstTranslation = finded[0]
        return replaceLastPart(firstTranslation.translated, firstTranslation.line)
    })
}

const translateFile = async (inputFile, outputFile) => {

    console.info('Começando Tradução da legenda...')

    const lines = readSubtitleFile(inputFile)
    const {dialoguesLines, dialogues} = getSSADialogues(lines)
    const translations = await translateEnToPt(dialogues)
    
    const dialoguesMap = dialogues.map((original, index) => {
        const translated = translations[index]
        const line = dialoguesLines[index]
        return {line, original, translated}
    })

    const editedLines = getEditedFileContent(lines, dialoguesMap)    

    console.log(editedLines)

    writeSubtitleFile(editedLines, outputFile)

}

// const path = '/home/lourran/Downloads/tmp'
// const input = `${path}/[HorribleSubs] Infinite Dendrogram - 10 [1080p].srt`
// const output = `${path}/[HorribleSubs] Infinite Dendrogram - 10 [1080p].srt`

// extractSubtitle(path)
//    .then(() => translateFile(input, output))
//    .then(() => joinSubtitle(path))

// translateFile('str.str', 'str-br.str')

module.exports = {
    translateFile,
    extractSubtitle,
    joinSubtitle
}