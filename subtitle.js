const fs = require('fs')
const translate = require('google-translate-open-api').default


const main = async () => {
    const fileContent = fs.readFileSync('str.str', 'utf8')

    const REGEX_REMOVE = [
        {old: '\\N', neww: ' '},
        {old: '\\i0}', neww: ''},
        {old: '{\\i1}', neww: ''},
        {old: '<i>', neww: ''},
        {old: '</i>', neww: ''},
        {old: '<b>', neww: ''},
        {old: '</b>', neww: ''},
        {old: '{\an8}', neww: ''},
    ]

    const dialogues = fileContent.split('\n')
        .filter(l => l.indexOf('Dialogue') == 0)
        .map(col => col.split(',').pop())
        .map(d => {
            let value = d   
            for (const rg of REGEX_REMOVE) { value = value.split(rg.old).join(rg.neww) }
            return value
        })

    let translations = await translate(dialogues, {tld: "cn", from: "en", to: "pt"})
    translations = translations.data[0]

    dialogues.map((original, index) => {
        const translated = translations[index][0][0][0]
        return {original, translated}
    })

}

main().then('Finished')