export const getFeedsBounds = (feeds) => {
  const feedsWithBounds = feeds.filter((feed) => {
    return feed.latestValidation && feed.latestValidation.bounds;
  });

  if (feedsWithBounds.length === 0) { return; }

  let northEastBound = (nextBound, currentBound) => {
    return nextBound > currentBound ? nextBound : currentBound;
  };

  let southWestBound = (nextBound, currentBound) => {
    return nextBound < currentBound ? nextBound : currentBound;
  };

  return feedsWithBounds.reduce((bounds, feed) => {
    return {
      east: northEastBound(feed.latestValidation.bounds.east, bounds.east),
      west: southWestBound(feed.latestValidation.bounds.west, bounds.west),
      north: northEastBound(feed.latestValidation.bounds.north, bounds.north),
      south: southWestBound(feed.latestValidation.bounds.south, bounds.south)
    };
  }, feedsWithBounds[0].latestValidation.bounds);
};
