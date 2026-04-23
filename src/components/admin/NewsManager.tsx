import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useCreateBlogPostMutation,
  useDeleteBlogPostMutation
} from '../../store/services/announcementApi';
import Spinner from '../layout/Spinner';
import Time from '../layout/Time';

const inputClass =
  'rounded bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const NewsManager = () => {
  const { data: announcements, isLoading } = useGetAnnouncementsQuery();
  const [createAnnouncement, { isLoading: creatingNews }] =
    useCreateAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [createBlogPost, { isLoading: creatingBlog }] =
    useCreateBlogPostMutation();
  const [deleteBlogPost] = useDeleteBlogPostMutation();

  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogBody, setBlogBody] = useState('');

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAnnouncement({ title: newsTitle, body: newsBody });
    setNewsTitle('');
    setNewsBody('');
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBlogPost({ title: blogTitle, body: blogBody });
    setBlogTitle('');
    setBlogBody('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          to="/private/staff/tools"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Toolbox
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-white">News Manager</h2>
      </div>

      {/* Announcements (News) */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Announcements
          </h3>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Title</th>
                <th className="text-left px-4 py-2 font-semibold">Posted</th>
                <th className="px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!announcements?.data?.announcements?.length ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No announcements.
                  </td>
                </tr>
              ) : (
                announcements.data.announcements.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-200 font-medium">
                      {n.title}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={n.createdAt} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(n.id)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <form
          onSubmit={handleCreateNews}
          className="p-4 border-t border-gray-700 space-y-3"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Post Announcement
          </h4>
          <input
            type="text"
            value={newsTitle}
            onChange={(e) => setNewsTitle(e.target.value)}
            placeholder="Title"
            required
            className={`${inputClass} w-full`}
          />
          <textarea
            value={newsBody}
            onChange={(e) => setNewsBody(e.target.value)}
            placeholder="Body"
            rows={4}
            required
            className={`${inputClass} w-full`}
          />
          <button
            type="submit"
            disabled={creatingNews}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {creatingNews ? 'Posting…' : 'Post Announcement'}
          </button>
        </form>
      </div>

      {/* Blog posts */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-700/60 px-4 py-2 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Blog Posts
          </h3>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700/40 text-xs uppercase tracking-wider text-gray-400">
                <th className="text-left px-4 py-2 font-semibold">Title</th>
                <th className="text-left px-4 py-2 font-semibold">Author</th>
                <th className="text-left px-4 py-2 font-semibold">Posted</th>
                <th className="px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {!announcements?.data?.blogPosts?.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No blog posts.
                  </td>
                </tr>
              ) : (
                announcements.data.blogPosts.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-gray-200 font-medium">
                      {b.title}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {b.user?.username ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      <Time date={b.createdAt} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteBlogPost(b.id)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <form
          onSubmit={handleCreateBlog}
          className="p-4 border-t border-gray-700 space-y-3"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Write Blog Post
          </h4>
          <input
            type="text"
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            placeholder="Title"
            required
            className={`${inputClass} w-full`}
          />
          <textarea
            value={blogBody}
            onChange={(e) => setBlogBody(e.target.value)}
            placeholder="Body"
            rows={6}
            required
            className={`${inputClass} w-full`}
          />
          <button
            type="submit"
            disabled={creatingBlog}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {creatingBlog ? 'Posting…' : 'Post Blog Entry'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsManager;
