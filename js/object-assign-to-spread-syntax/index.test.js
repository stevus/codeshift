const fs = require('fs')
const glob = require('fast-glob')
const transform = require('./index')
const path = require('path')

const inputDataGlobs = [
    path.join(__dirname, '/input-*.js'),
]
const expectedOutputDataGlobs = [
    path.join(__dirname, '/expected-*.js'),
]
const inputDataFiles = glob.sync(inputDataGlobs)
const expectedOutputDataFiles = glob.sync(expectedOutputDataGlobs)

inputDataFiles.forEach((inputFileName, i) => {
    const testNumber = inputFileName
      .split('/')[inputFileName.split('/').length - 1]
      .split('.')[0]
      .split('-')[1]

    const inputFile = fs.readFileSync(
      inputFileName,
      'utf8'
    )
    const expectedOutputFile = fs.readFileSync(
      expectedOutputDataFiles[i],
      'utf8'
    )

    // TODO: Compare the two here
})
