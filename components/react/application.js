'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { Config } from './config';
import { Analytics } from './analytics';
import { Post }  from './post';
import Viewer from './viewer';
import Footer from './footer';

const archive = require('../archive');
const getPostData = require('../userPost');
const { ipcRenderer } = electronRequire('electron');

//TODO: implement analytics
//TODO: handle post error
//TODO: implement errors and end
//TODO: request not aborting on abort call
//TODO: remove [[MORE]] on text (possibly others) posts.

String.prototype.dateShorten = function(){
  return this.replace(/(\w|-|:)*/,function(txt) {
      return txt.substr(0,txt.indexOf('T'));
  });
}
String.prototype.bodyShorten = function(){
  var CharIndex = this[19] === ' ' ? 18: 19;
  return (this.length > 196) ? this.substr(0,this.charAt(193) === ' ' ? 192 : 193) + '...' : this.toString();
}
String.prototype.headlineShorten = function(){
  return (this.length >= 26) ? this.substr(0,this.charAt(23) === ' ' ? 22: 23) + '...' : this.toString();
}
String.prototype.capitalizeEach = function(){
    return this.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
function exactMatch(r,str){
  const match = str.match(r);
  return match != null && str == match[0];
}

class Application extends React.Component {

  constructor(props){
    super(props);
    this.archive = new archive();
    this.defaultFooter = {
      dateDepth:null,
      requestDepth:null,
      postCount:0,
      errorString:null
    };
    this.state = {
      removeClickedPost:null,
      isRunning:false,
      isErrorFound:false,
      isViewing:false,
      scrapedPosts:[],
      currentPost:null,
      footerData:JSON.parse(JSON.stringify(this.defaultFooter))
    }

    this.archive.on('nextPage',(path) => {
      this.state.footerData.requestDepth = path;
      this.setState(this.state);
    });

    this.archive.on('post', postInfo => {
      getPostData(postInfo, (err, data) => {
        if (err !== null){
          console.warn('Terminal','Error fetching Post Data');

          return;
        }

        let {datePublished=null, articleBody=null, headline=null,
        image, url=''} = data.postData;

        this.state.scrapedPosts.push({
          type: data.type,
          datePublished: datePublished,
          articleBody: articleBody,
          headline: headline,
          images: image ? image['@list'] || [image] : [],
          url: url
        });

        this.state.footerData.postCount += 1;
        this.setStateKeepScroll();
      });
    });

    this.archive.on('date',dateString => {
      this.state.footerData.dateDepth = dateString;
      this.setState(this.state);
    });

    this.archive.on('abort',() => {
      console.log('Abort event caught inside application.js');
    });

    this.archive.on('requestError',(urlInfo) => {
      this.state.footerData.errorString = urlInfo.message+' ('+urlInfo.path+')';
      this.stopRunning();
      this.setState(this.state);
    });

    this.archive.on('responseError',(urlInfo) => {
      console.log('shit');
      this.state.footerData.errorString = urlInfo.message+' ('+urlInfo.path+')';
      this.setState(this.state);
    });

    this.archive.on('end',() =>{
      this.setState({ isRunning:false });
    });
  }

  startRunning = (blogname, types) => {
    if (!types.length){
      console.warn('Terminal:', 'No types selected');
      return;
    }
    if (!(exactMatch(/([0-9]|[a-z]|[A-Z])+(\-*([0-9]|[a-z]|[A-Z]))*/, blogname))){
      console.warn('Terminal', blogname+' is invalid Blogname');
      return;
    }
    this.archive.stop();
    this.setState({ scrapedPosts : [],
                    isRunning: true,
                    currentPost: null,
                    isViewing: false,
                    footerData:JSON.parse(JSON.stringify(this.defaultFooter))
                  });
    this.archive.go(blogname, types);
  }
  openInBrowser = url => {
    ipcRenderer.send('asynchronous-message',url);
  }

  handlePostClicked = (unClickCB, data) => {
    delete data['onClick'];
    Object.keys(data).forEach((elem) => {
      if (!data[elem]){
        delete data[elem];
      }
    });
    if (this.state.removeClickedPost) this.state.removeClickedPost();
    this.setState({
      removeClickedPost:unClickCB,
      currentPost:data,
      isViewing:true
    });
  }

  stopRunning = () => {
    if (!this.archive.stop()){
      console.log('error conducting stop, check loop.js');
    }
    this.setState({
      isRunning:false,
    });

  }

  setStateKeepScroll = () => {
    const m = document.getElementById('keep-bottom'),
    keepBottom = m.scrollTop+1 >= m.scrollHeight - m.clientHeight;
    this.setState(this.state);
    if (keepBottom) m.scrollTop = m.scrollHeight - m.clientHeight;
  }

  render(){
    return(
      <div className='height100width100' id='wrapper'>
        <div id='content'>
          <div id='left-panel-wrapper'>
           <div id='left-panel'>
             <div id='title-wrapper'>
               <h1 className='vertical-center-contents'>Config</h1>
             </div>
             <div id='config-wrapper'>
                <Config
                      startRunning={this.startRunning}
                      isRunning={this.state.isRunning}
                      stopRunning={this.stopRunning}
                />
             </div>
             <Analytics />
           </div>
         </div>

         <div id='mid-panel-wrapper'>
           <div id='middle-panel'>
           <div className='height100width100 scroll-box' id='keep-bottom'>
             { this.state.scrapedPosts.length > 1 ? this.state.scrapedPosts.map((scrapedPost, index) =>
               <Post onClick={this.handlePostClicked} key={index} {...scrapedPost} />
             ) : <div className='height100width100 notfound'></div>}
           </div>
          </div>
        </div>

        <div id='right-panel-wrapper'>
          {this.state.isViewing ?
              <Viewer post={this.state.currentPost} openInBrowser={this.openInBrowser}/>
            :
              <div className='height100width100 notselected'></div>
          }
        </div>
    </div>
    <Footer isRunning={this.state.isRunning} {...this.state.footerData} isErrorFound={this.errorFound}/>
  </div>
)
  }
}


ReactDOM.render(<Application />,document.getElementById('app-container'));