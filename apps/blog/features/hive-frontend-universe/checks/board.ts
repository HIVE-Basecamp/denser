/**
 * The board builder's readings of a post and its author (ticket 47).
 *
 * The curation trail marks what a post is still missing and throws confetti at
 * a first ever post, so these hold the three facts that decide those marks to
 * the raw chain values they come from.
 */

import { buildBoard, type RawAccount, type RawPost } from '../lib/board';
import { check, equal } from './harness';

const WINDOW_START = 1_757_000_000_000;

/** A root post inside the window, with whatever counts the test needs. */
function post(author: string, votes: number, replies: number): RawPost {
  return {
    author,
    permlink: `post-${author}`,
    title: `${author} writes`,
    body: 'body',
    created: new Date(WINDOW_START + 60_000).toISOString().replace('Z', ''),
    category: 'hive-1',
    children: replies,
    stats: { total_votes: votes },
    active_votes: Array.from({ length: votes }, (_, i) => ({ voter: `voter-${i}` }))
  };
}

/** An account, aged a year and a day so it is never a newcomer by accident. */
function account(name: string, postCount: number | undefined): RawAccount {
  return {
    name,
    created: new Date(WINDOW_START - 366 * 24 * 60 * 60 * 1000).toISOString().replace('Z', ''),
    vesting_shares: '1000.000000 VESTS',
    post_count: postCount
  };
}

export function boardChecks(): void {
  const board = buildBoard({
    posts: [post('first', 0, 0), post('second', 3, 2), post('unknown', 1, 0)],
    accounts: [account('first', 1), account('second', 40), account('unknown', undefined)],
    counts: { votes: 0, comments: 0, customJson: 0, transfers: 0, source: 'blocks' },
    windowStart: WINDOW_START,
    vestsToHive: 0.0005,
    seed: WINDOW_START
  });
  const houseOf = (handle: string) => {
    const h = board.houses.find((house) => house.handle === handle);
    if (!h) throw new Error(`no house for ${handle}`);
    return h;
  };

  check('board: a post carries its own vote and reply counts', () => {
    equal(houseOf('first').post.votes, 0, 'votes on an untouched post');
    equal(houseOf('first').post.comments, 0, 'replies on an untouched post');
    equal(houseOf('second').post.votes, 3, 'votes');
    equal(houseOf('second').post.comments, 2, 'replies');
  });

  check('board: a first ever post is known from the chain’s own count', () => {
    equal(houseOf('first').firstPost, true, 'one thing published, so this is it');
    equal(houseOf('second').firstPost, false, 'forty things published');
  });

  check('board: an unknown post count never calls a post the first', () => {
    equal(houseOf('unknown').firstPost, false, 'no count, no claim');
  });
}
