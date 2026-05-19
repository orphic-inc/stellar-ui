import { createTestStore } from '../testUtils';
import { ensureRequestPolyfill, makeResponse } from '../fetchTestUtils';
import { communityApi } from '../../store/services/communityApi';
import { downloadApi } from '../../store/services/downloadApi';
import { profileApi } from '../../store/services/profileApi';
import { reportsApi } from '../../store/services/reportsApi';
import { requestApi } from '../../store/services/requestApi';
import { userApi } from '../../store/services/userApi';
import { wikiApi } from '../../store/services/wikiApi';

const fetchMock = jest.fn();

const getLastRequest = async () => {
  const request = fetchMock.mock.calls.at(-1)?.[0] as Request | undefined;
  if (!request) throw new Error('Expected fetch to be called');

  return {
    url: request.url,
    method: request.method,
    body: await request.text()
  };
};

beforeAll(() => {
  ensureRequestPolyfill();
  Object.defineProperty(globalThis, 'fetch', {
    value: fetchMock,
    writable: true
  });
});

beforeEach(() => {
  fetchMock.mockReset();
});

describe('resource-oriented service APIs', () => {
  it('builds communityApi requests for communities, releases, contributions, votes, and tags', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(communityApi.endpoints.getCommunities.initiate(3)),
        response: { status: 200, body: { data: [], meta: { page: 3 } } },
        expected: { url: '/api/communities?page=3', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(communityApi.endpoints.getCommunityById.initiate(9)),
        response: { status: 200, body: { id: 9 } },
        expected: { url: '/api/communities/9', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.updateCommunity.initiate({
              id: 9,
              name: 'Jazz',
              allowDuplicateFormats: true
            })
          ),
        response: { status: 200, body: { id: 9, name: 'Jazz' } },
        expected: {
          url: '/api/communities/9',
          method: 'PUT',
          body: JSON.stringify({
            name: 'Jazz',
            allowDuplicateFormats: true
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.getReleasesByCommunity.initiate({
              communityId: 9,
              page: 2
            })
          ),
        response: { status: 200, body: { data: [], meta: { page: 2 } } },
        expected: {
          url: '/api/communities/9/releases?page=2',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.createRelease.initiate({
              communityId: 9,
              title: 'Kind of Blue'
            })
          ),
        response: { status: 201, body: { id: 3, title: 'Kind of Blue' } },
        expected: {
          url: '/api/communities/9/releases',
          method: 'POST',
          body: JSON.stringify({ title: 'Kind of Blue' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.addContributionToRelease.initiate({
              communityId: 9,
              releaseId: 3,
              fileType: 'flac',
              downloadUrl: 'https://files.example/flac',
              sizeInBytes: 512
            })
          ),
        response: { status: 201, body: { id: 14 } },
        expected: {
          url: '/api/communities/9/releases/3/contributions',
          method: 'POST',
          body: JSON.stringify({
            fileType: 'flac',
            downloadUrl: 'https://files.example/flac',
            sizeInBytes: 512
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.voteOnRelease.initiate({
              communityId: 9,
              releaseId: 3,
              positive: true
            })
          ),
        response: {
          status: 200,
          body: { myVote: 'up', voteAggregate: { releaseId: 3, ups: 1 } }
        },
        expected: {
          url: '/api/communities/9/releases/3/vote',
          method: 'POST',
          body: JSON.stringify({ positive: true })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.removeVoteOnRelease.initiate({
              communityId: 9,
              releaseId: 3
            })
          ),
        response: { status: 200, body: { myVote: null, voteAggregate: null } },
        expected: {
          url: '/api/communities/9/releases/3/vote',
          method: 'DELETE',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.addTagToRelease.initiate({
              communityId: 9,
              releaseId: 3,
              name: 'modal-jazz'
            })
          ),
        response: { status: 201, body: { id: 6, name: 'modal-jazz' } },
        expected: {
          url: '/api/communities/9/releases/3/tags',
          method: 'POST',
          body: JSON.stringify({ name: 'modal-jazz' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            communityApi.endpoints.removeTagFromRelease.initiate({
              communityId: 9,
              releaseId: 3,
              tagId: 6
            })
          ),
        response: { status: 204 },
        expected: {
          url: '/api/communities/9/releases/3/tags/6',
          method: 'DELETE',
          body: ''
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });

  it('builds requestApi requests for list, mutate, and history flows', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            requestApi.endpoints.listRequests.initiate({
              page: 2,
              communityId: 9,
              status: 'open'
            })
          ),
        response: { status: 200, body: { data: [], meta: { page: 2 } } },
        expected: {
          url: '/api/requests?page=2&communityId=9&status=open',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(requestApi.endpoints.getRequest.initiate(5)),
        response: { status: 200, body: { id: 5 } },
        expected: { url: '/api/requests/5', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            requestApi.endpoints.createRequest.initiate({
              communityId: 9,
              type: 'Music',
              title: 'Bitches Brew',
              description: 'Need a clean rip',
              bounty: '25.00'
            })
          ),
        response: { status: 201, body: { id: 5 } },
        expected: {
          url: '/api/requests',
          method: 'POST',
          body: JSON.stringify({
            communityId: 9,
            type: 'Music',
            title: 'Bitches Brew',
            description: 'Need a clean rip',
            bounty: '25.00'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            requestApi.endpoints.updateRequest.initiate({
              id: 5,
              title: 'Updated title'
            })
          ),
        response: { status: 200, body: { id: 5 } },
        expected: {
          url: '/api/requests/5',
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated title' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            requestApi.endpoints.addBounty.initiate({
              requestId: 5,
              amount: '10.00'
            })
          ),
        response: { status: 200, body: { id: 5 } },
        expected: {
          url: '/api/requests/5/bounty',
          method: 'POST',
          body: JSON.stringify({ amount: '10.00' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            requestApi.endpoints.fillRequest.initiate({
              requestId: 5,
              contributionId: 12
            })
          ),
        response: { status: 200, body: { id: 5 } },
        expected: {
          url: '/api/requests/5/fill',
          method: 'POST',
          body: JSON.stringify({ contributionId: 12 })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            requestApi.endpoints.unfillRequest.initiate({
              requestId: 5,
              reason: 'bad upload'
            })
          ),
        response: { status: 200, body: { id: 5 } },
        expected: {
          url: '/api/requests/5/unfill',
          method: 'POST',
          body: JSON.stringify({ reason: 'bad upload' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(requestApi.endpoints.deleteRequest.initiate(5)),
        response: { status: 204 },
        expected: {
          url: '/api/requests/5',
          method: 'DELETE',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(requestApi.endpoints.toggleRequestVote.initiate(5)),
        response: { status: 200, body: { voted: true } },
        expected: {
          url: '/api/requests/5/vote',
          method: 'POST',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            requestApi.endpoints.getRequestBountyHistory.initiate(5)
          ),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/requests/5/bounty-history',
          method: 'GET',
          body: ''
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });

  it('builds userApi, profileApi, and wikiApi requests across user and wiki workflows', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(userApi.endpoints.getUserById.initiate(7)),
        response: { status: 200, body: { id: 7 } },
        expected: { url: '/api/users/7', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(userApi.endpoints.getUserSettings.initiate()),
        response: { status: 200, body: { profileInfo: '' } },
        expected: { url: '/api/users/settings', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            userApi.endpoints.updateUserSettings.initiate({
              siteAppearance: 'classic'
            })
          ),
        response: { status: 200, body: { siteAppearance: 'classic' } },
        expected: {
          url: '/api/users/settings',
          method: 'PUT',
          body: JSON.stringify({ siteAppearance: 'classic' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            userApi.endpoints.warnUser.initiate({
              id: 7,
              reason: 'Rule violation',
              expiresAt: '2027-01-01T00:00:00.000Z'
            })
          ),
        response: { status: 201, body: { msg: 'Warned' } },
        expected: {
          url: '/api/users/7/warn',
          method: 'POST',
          body: JSON.stringify({
            reason: 'Rule violation',
            expiresAt: '2027-01-01T00:00:00.000Z'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            userApi.endpoints.addUserNote.initiate({
              id: 7,
              body: 'staff note'
            })
          ),
        response: { status: 201, body: { msg: 'Created' } },
        expected: {
          url: '/api/users/7/notes',
          method: 'POST',
          body: JSON.stringify({ body: 'staff note' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            userApi.endpoints.removeUserWarning.initiate({ id: 7, warnId: 3 })
          ),
        response: { status: 204 },
        expected: {
          url: '/api/users/7/warnings/3',
          method: 'DELETE',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(userApi.endpoints.getSnatchList.initiate()),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/users/me/snatch-list',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            userApi.endpoints.createDonorRank.initiate({
              name: 'Gold',
              minDonation: 50
            })
          ),
        response: { status: 201, body: { id: 2, name: 'Gold' } },
        expected: {
          url: '/api/users/donor-ranks',
          method: 'POST',
          body: JSON.stringify({ name: 'Gold', minDonation: 50 })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            userApi.endpoints.grantDonor.initiate({
              id: 7,
              donorRankId: 2
            })
          ),
        response: { status: 201, body: { msg: 'Granted' } },
        expected: {
          url: '/api/users/7/donor',
          method: 'POST',
          body: JSON.stringify({ donorRankId: 2 })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(userApi.endpoints.getSnatchListByUserId.initiate(7)),
        response: { status: 200, body: [] },
        expected: {
          url: '/api/users/7/snatch-list',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(profileApi.endpoints.getMyProfile.initiate()),
        response: { status: 200, body: { id: 7 } },
        expected: { url: '/api/profile/me', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            profileApi.endpoints.createInvite.initiate({
              email: 'friend@example.com',
              reason: 'trusted'
            })
          ),
        response: { status: 201, body: { inviteKey: 'abc' } },
        expected: {
          url: '/api/profile/referral/create-invite',
          method: 'POST',
          body: JSON.stringify({
            email: 'friend@example.com',
            reason: 'trusted'
          })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            wikiApi.endpoints.getWikiPages.initiate({ q: 'ratio' })
          ),
        response: { status: 200, body: { data: [], meta: { total: 0 } } },
        expected: { url: '/api/wiki?q=ratio', method: 'GET', body: '' }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            wikiApi.endpoints.getWikiPageByAlias.initiate('ratio rules')
          ),
        response: { status: 200, body: { id: 4, title: 'Ratio Rules' } },
        expected: {
          url: '/api/wiki/by-alias/ratio%20rules',
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            wikiApi.endpoints.addWikiAlias.initiate({
              id: 4,
              alias: 'ratio rules'
            })
          ),
        response: { status: 201, body: { alias: 'ratio rules' } },
        expected: {
          url: '/api/wiki/4/aliases',
          method: 'POST',
          body: JSON.stringify({ alias: 'ratio rules' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            wikiApi.endpoints.deleteWikiAlias.initiate({
              id: 4,
              alias: 'ratio rules'
            })
          ),
        response: { status: 204 },
        expected: {
          url: '/api/wiki/4/aliases/ratio%20rules',
          method: 'DELETE',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            wikiApi.endpoints.compareWikiRevisions.initiate({
              id: 4,
              old: 1,
              new: 2
            })
          ),
        response: {
          status: 200,
          body: { pageId: 4, title: 'Ratio Rules', old: {}, new: {} }
        },
        expected: {
          url: '/api/wiki/4/compare?old=1&new=2',
          method: 'GET',
          body: ''
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });

  it('builds downloadApi requests covering both branches of idempotencyKey and reason', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            downloadApi.endpoints.grantAccess.initiate({
              contributionId: 5,
              idempotencyKey: 'key-abc'
            })
          ),
        response: { status: 200, body: { id: 1 } },
        expected: {
          url: '/api/contributions/5/access',
          method: 'POST',
          body: JSON.stringify({ idempotencyKey: 'key-abc' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            downloadApi.endpoints.grantAccess.initiate({ contributionId: 7 })
          ),
        response: { status: 200, body: { id: 2 } },
        expected: {
          url: '/api/contributions/7/access',
          method: 'POST',
          body: '{}'
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            downloadApi.endpoints.reverseGrant.initiate({
              grantId: 10,
              reason: 'Bad link'
            })
          ),
        response: { status: 200, body: { grantId: 10, status: 'reversed' } },
        expected: {
          url: '/api/downloads/10/reverse',
          method: 'POST',
          body: JSON.stringify({ reason: 'Bad link' })
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            downloadApi.endpoints.reverseGrant.initiate({ grantId: 11 })
          ),
        response: { status: 200, body: { grantId: 11, status: 'reversed' } },
        expected: {
          url: '/api/downloads/11/reverse',
          method: 'POST',
          body: '{}'
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            downloadApi.endpoints.reportContribution.initiate({
              contributionId: 3,
              reason: 'Dead link'
            })
          ),
        response: { status: 200, body: { msg: 'Reported' } },
        expected: {
          url: '/api/contributions/3/report',
          method: 'POST',
          body: JSON.stringify({ reason: 'Dead link' })
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      expect(await getLastRequest()).toEqual(testCase.expected);
    }
  });

  it('builds reportsApi requests covering reporterUsername branch', async () => {
    const cases = [
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(
            reportsApi.endpoints.getReports.initiate({
              reporterUsername: 'alice'
            })
          ),
        response: {
          status: 200,
          body: { total: 0, page: 1, pageSize: 25, reports: [] }
        },
        expected: {
          url: expect.stringContaining('reporterUsername=alice'),
          method: 'GET',
          body: ''
        }
      },
      {
        run: (store: ReturnType<typeof createTestStore>) =>
          store.dispatch(reportsApi.endpoints.getReports.initiate({})),
        response: {
          status: 200,
          body: { total: 0, page: 1, pageSize: 25, reports: [] }
        },
        expected: {
          url: expect.not.stringContaining('reporterUsername'),
          method: 'GET',
          body: ''
        }
      }
    ];

    for (const testCase of cases) {
      const store = createTestStore();
      fetchMock.mockResolvedValueOnce(makeResponse(testCase.response));
      await testCase.run(store).unwrap();
      const req = await getLastRequest();
      expect(req.url).toEqual(testCase.expected.url);
    }
  });
});
