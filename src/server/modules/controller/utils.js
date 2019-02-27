const removeMORE = str => str.replace('[[MORE]]', '');

const pipeEmit = (events, from, to) => {
  events.forEach((event) => {
    from.on(event, function() {
      to.emit.apply(to, [event].concat(Array.slice.call(arguments, 0)));
    });
  });
};

const craftPost = rawPost => ({
  type: rawPost.type,
  datePublished: rawPost.datePublished || '',
  articleBody: rawPost.articleBody ? removeMORE(post.articleBody) : '',
  headline: rawPost.headline || '',
  images: [].concat(!rawPost.image ? null : rawPost.image['@list'] || rawPost.image),
  url: rawPost.url || '',
  isVideo: rawPost.isVideo,
  videoURL: post.videoURL || ''
});

module.exports = {
  removeMORE,
  pipeEmit,
  craftPost
};