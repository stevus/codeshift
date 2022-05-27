const fs = require('fs')
const glob = require('fast-glob')
const transform = require('./index')
const path = require('path')

const inputDataGlobs = [
    path.join(__dirname, '/testInputs/*.js'),
]
const expectedOutputDataGlobs = [
    path.join(__dirname, '/testOutputs/*.js'),
]
const inputDataFiles = glob.sync(inputDataGlobs)
const expectedOutputDataFiles = glob.sync(expectedOutputDataGlobs)

inputDataFiles.forEach((inputFileName, i) => {
    const testNumber = inputFileName
      .split('/')[inputFileName.split('/').length - 1]
      .split('.')[0]

    const inputFile = fs.readFileSync(
      inputFileName,
      'utf8'
    )
    const expectedOutputFile = fs.readFileSync(
      expectedOutputDataFiles[i],
      'utf8'
    )

    // REVIEW: Compare the filenames to make sure numbers match up?

    // TODO: Compare the two here
})
