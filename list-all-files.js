const fs = require("fs")
const path = require("path")

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach((file) => {
    const dirFile = path.join(dir, file)
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile)
    } catch (err) {
      console.log(`Error reading file ${dirFile}: ${err.message}`)
    }
  })
  return filelist
}

console.log("Listing all files in the project:")
const files = walkSync(".")
files.forEach((file) => console.log(file))
