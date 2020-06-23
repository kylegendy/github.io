
var pluralize = require('pluralize'); // for checkString funct, pluralizes words
var synonyms = require("synonyms"); // for checkString funct, finds synonyms

var fs = require("fs");
var text = fs.readFileSync("./serialData.txt", "utf-8");
var textArr = text.split(",");

const CHARS_USED = ['$', '%', '-', '.', '0', '1', '2', '3', '4', '5', '6', '7',
  '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
  'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
  'y', 'z'];
const ARR_CHAR_SIZE = CHARS_USED.length;
var charIndex = []; // allows for easy direct access to TNodes
var validCharCnt = 0;
// iterate through every elem in charIndex, if not valid pushes -1
for (var i = 0; i < 256; ++i) {
    if (i == String(CHARS_USED[validCharCnt]).charCodeAt(0)) { charIndex.push(validCharCnt); ++validCharCnt; }
    else { charIndex.push(-1); }
}

// Node class for the Trie
class Node {
  constructor () {
    this.val = "?";
    this.numFiles = 0;
    this.fileRef = [];
    this.fileRatio = [];
    this.fileTitle = [];
    this.children = new Array(39).fill(null);
  }
}

// class to hold place values for ranking files during search function
class DubleVal {
  constructor () {
    this.fileName = "?";
    this.val = 0;
  }
}

// Trie class
class Trie {
  constructor () {
    this.fileNameRefs = [];
    this.fileWordCnts = [];
    this.head = new Node();
  }
  // function recursively adds values to node trie
  recLoadNodeTrie (index, node) {

    // get val
    node.val = textArr[index]; ++index;

    // get number of files
    node.numFiles = parseInt(textArr[index]); ++index;

    // store file values
    for (var i = 0; i < node.numFiles; ++i) {

      // push file reference integer
      node.fileRef.push(parseInt(textArr[index])); ++index;

      // find word count and create ratio
      // todo this is wild... check this over
      var ratio = parseInt(textArr[index]) / this.fileWordCnts[ node.fileRef[i] ]; ++index;

      // push ratio
      node.fileRatio.push(ratio);

      // push file isTitle
      node.fileTitle.push(parseInt(textArr[index])); ++index;
    }

    // todo, below this comment there is an issue with ++index which throws everything off
    // find child count
    var childCnt = parseInt(textArr[index]);

    // add new nodes
    for (var i = 0; i < childCnt; ++i) {
      ++index;
      // get child val
      var cChar = textArr[index];
      var cCode = (cChar).charAt(0).charCodeAt(0); //todo get rid of charAt??
      var easyCode = charIndex[cCode]; // figure out which child node to be edited
      node.children[easyCode] = new Node();

      // rec adds children
      var theRest = this.recLoadNodeTrie(index, node.children[easyCode]);
      node.children[easyCode] = theRest.child;
      index = theRest.index;
    }

    return {"index": index, "child": node };
  }
  // loads in the serial file
  loadFromTxt () {
    var index = 0;
  
    // get the number of files
    var numberOfFiles = parseInt(textArr[index]); ++index;
  
    // get top line stuff, ie file names and respective word counts
    for (var i = 0; i < numberOfFiles; ++i) {
  
      // push file name
      myTrie.fileNameRefs.push(textArr[index]); ++index;
  
      // push file word count
      myTrie.fileWordCnts.push(parseInt(textArr[index])); ++index;
  
    }
  
    // parse rest of file
    if (numberOfFiles > 0) {
  
      //rec add nodes
      this.recLoadNodeTrie(index, this.head);
  
    }
  
  }
  // quicksort function to order file rank
  recSortParas (files, partitioner) {

    // if there's only one/zero item left
    if (files.length === 0) { return []; }
    if (files.length === 1) { return [ this.fileNameRefs[ files[0].fileName ] ]; }

    // define vars
    var smlRefs = [];
    var bigRefs = [];

    // compare vals
    var prtVal = files[partitioner].val;
    for (var indx = 0; indx < files.length; ++indx) {

      if (indx !== partitioner) {
        if (files[indx].val > prtVal) {
          bigRefs.push( files[indx]);
        } else {
          smlRefs.push( files[indx]);
        }
      }

    }

    //todo this is wild
    var firstPrt = this.recSortParas(bigRefs, bigRefs.length / 2);
    var secondPrt = this.recSortParas(smlRefs, smlRefs.length / 2);
    firstPrt = [].concat( firstPrt, [this.fileNameRefs[ files[partitioner].fileName ]] ); // add partition
    firstPrt = [].concat( firstPrt, secondPrt ); // add second part
    return firstPrt;
  }
  // takes a cleaned up word and determines the file ranking value (unordered).
  getWord (node, numSearchWords, word, isSynonym) {

    if (word === "") {
      if (node.numFiles === 0) { return null; } // if empty return null
      var fileList = [];
      var pH;
      for (var i = 0; i<node.numFiles; ++i) { // make array with file info
        pH = new DubleVal;
        pH.fileName = node.fileRef[i]; // add name ref
        pH.val += parseFloat(node.fileTitle[i] / numSearchWords); // add value
        pH.val += parseFloat(node.fileRatio);

        if (isSynonym) { pH.val = parseFloat(pH.val / 2); }

        fileList.push(pH);
      }

      return fileList;
    }

    // get the easy access integer
    var easyCode = charIndex[word.charAt(0).charCodeAt(0)];
    if (node.children[easyCode] === null) { return null; }

    // get val
    var ndVal = node.children[easyCode].val;

    // compare node val and word
    if (ndVal.length > word.length) { return null; }
    for (var i = 0; i < ndVal.length; ++i) {
      if (ndVal[i] !== word[i]) { // if it's not all the same
        return null;
      }
    }
    word = word.substring(ndVal.length);

    return this.getWord(node.children[easyCode], numSearchWords, word, isSynonym);
  }
  // make the word all undercase and ignore specific characters
  cleanWord(word) {
    var newWord = "";
    for (var i=0; i<word.length; ++i) {
      if (charIndex[word.charCodeAt(i)] !== -1) { newWord += word.charAt(i).toLowerCase(); }
    }
    return newWord;
  }
  // given a large (presumably a sentence) string, breaks it into an array of words, cleans it up, adds tenses, synonyms, and singular/plural forms to the list of words to check, and sends it off to getWord one at a time.  Finally, sorts the output from getWord.
  checkString (str) {

    // split up the entire string into an array
    var delimited = str.split(" ");
  
    // todo what if empty?

    // clean up
    for (var i = 0; i<delimited.length; ++i) {
      delimited[i] = this.cleanWord(delimited[i]);
    }

    // ensure no duplicates
    delimited.sort();
    var pH;
    var dupCnt;
    for (var a=0; a<delimited.length; ++a) {
      if (delimited[a] === undefined) {
        delimited.splice(a,1);
        --a;
      }
      else {
        pH = delimited[a];
        dupCnt = 1;
        for (var b=1; b<(delimited.length-(a+1)); ++b) {
          if (delimited[a+b] === pH) { ++dupCnt; }
          else { break; }
        }
        if (dupCnt > 1) { delimited.splice(a,dupCnt); }
      }
    }

    // add tenses, synonyms, singular/plural forms

    // singular/plural -- pluralize/singularize, https://www.npmjs.com/package/pluralize
    var pHList = [];
    for (var i=0; i<delimited.length; ++i) {
      pH = pluralize.plural(delimited[i]);
      if (pH !== delimited[i]) { pHList.push(pH); }
      pH = pluralize.singular(delimited[i]);
      if (pH !== delimited[i]) { pHList.push(pH); }
    }
    delimited = [].concat(delimited, pHList);

    // ensure no duplicates after singular/plural
    delimited.sort();
    for (var a=0; a<delimited.length; ++a) {
      pH = delimited[a];
      dupCnt = 0;
      for (var b=a+1; b<(delimited.length-(a+1)); ++b) {
        if (delimited[b] === pH) { ++dupCnt; }
        else { break; }
      }
      if (dupCnt > 0) { delimited.splice(a,dupCnt); }
    }

    // synonyms -- synonyms, https://www.npmjs.com/package/synonyms
    var synList = [];
    for (var i=0; i<delimited.length; ++i) {
      synList = [].concat(synList, synonyms(delimited[i], "v"));
      synList = [].concat(synList, synonyms(delimited[i], "n"));
    }

    // tenses -- this is way too hard, would have to lemmatize cpp as well... ridiculous how hard it is to find a solid lib

    // sort/clean up synonyms
    synList.sort();
    for (var a=0; a<synList.length; ++a) {
      if (synList[a] === undefined) {
        synList.splice(a,1);
        --a;
      }
      else {
        pH = synList[a];
        dupCnt = 1;
        for (var b=1; b<(synList.length-(a+1)); ++b) {
          if (synList[a+b] === pH) { ++dupCnt; }
          else { break; }
        }
        if (dupCnt > 1) { synList.splice(a,dupCnt); }
      }
    }

    // iterate through hard list using getWord
    var rankList = [];
    for (var i=0; i<delimited.length; ++i) {
      pH = this.getWord(this.head, delimited.length, delimited[i], false);
      if (pH !== null) { rankList.push(pH); }
    }

    // iterate through synonyms
    for (var i=0; i<synList.length; ++i) {
      pH = this.getWord(this.head, synList.length, synList[i], false);
      if (pH !== null) { rankList.push(pH); }
    }

    // ensure no duplicates in ranked list, add all values together
    pH = (this.fileNameRefs);
    var shortRankList = new Array(pH.length).fill(null);
    for (var i=0; i<rankList.length; ++i) {
      for (var j=0; j<rankList[i].length; ++j) {
        if (shortRankList[ rankList[i][j].fileName ] === null) {
          shortRankList[ rankList[i][j].fileName ] = new DubleVal();
          shortRankList[ rankList[i][j].fileName ].fileName = rankList[i][j].fileName;
        }
        shortRankList[ rankList[i][j].fileName ].val = 
          parseFloat(shortRankList[ rankList[i][j].fileName ].val) + 
            parseFloat(rankList[i][j].val);
      }
    }

    // reorder list
    var rankedList = this.recSortParas(shortRankList, shortRankList.length / 2);

    // return descending order of file names
    return rankedList;

  }
}

console.time();
var myTrie = new Trie();
myTrie.loadFromTxt();
console.log(myTrie.checkString("here comes the sun doo do doo doo, here comes the sun"));
console.timeEnd();