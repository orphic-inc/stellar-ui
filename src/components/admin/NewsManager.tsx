import { useState } from 'react';
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useCreateBlogPostMutation,
  useDeleteBlogPostMutation
} from '../../store/services/announcementApi';
import Time from '../layout/Time';
import {
  PageShell,
  Panel,
  Button,
  Field,
  DataTable,
  SectionHeading,
  type Column
} from '../ui';

type AnnouncementRow = {
  id: number;
  title: string;
  createdAt: string;
};

type BlogRow = AnnouncementRow & { user?: { username: string } | null };

const NewsManager = () => {
  const {
    data: announcements,
    isLoading,
    error: announcementsError
  } = useGetAnnouncementsQuery();
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

  const announcementColumns: Column<AnnouncementRow>[] = [
    {
      header: 'Title',
      cell: (n) => <span className="font-medium">{n.title}</span>
    },
    {
      header: 'Posted',
      cell: (n) => (
        <span className="text-xs">
          <Time date={n.createdAt} />
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (n) => (
        <Button variant="link-danger" onClick={() => deleteAnnouncement(n.id)}>
          Delete
        </Button>
      )
    }
  ];

  const blogColumns: Column<BlogRow>[] = [
    {
      header: 'Title',
      cell: (b) => <span className="font-medium">{b.title}</span>
    },
    { header: 'Author', cell: (b) => b.user?.username ?? '—' },
    {
      header: 'Posted',
      cell: (b) => (
        <span className="text-xs">
          <Time date={b.createdAt} />
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (b) => (
        <Button variant="link-danger" onClick={() => deleteBlogPost(b.id)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <PageShell title="News Manager" width="lg">
      {/* Announcements (News) */}
      <section className="space-y-3">
        <SectionHeading>Announcements</SectionHeading>
        {announcementsError ? (
          <Panel className="p-4">
            <p data-st="prose" className="text-sm text-[var(--st-danger)]">
              Failed to load announcements.
            </p>
          </Panel>
        ) : (
          <DataTable
            columns={announcementColumns}
            rows={announcements?.announcements as AnnouncementRow[] | undefined}
            rowKey={(n) => n.id}
            isLoading={isLoading}
            empty="No announcements."
          />
        )}

        <Panel as="form" onSubmit={handleCreateNews} className="p-4 space-y-3">
          <SectionHeading className="text-xs">Post Announcement</SectionHeading>
          <Field
            type="text"
            value={newsTitle}
            onChange={(e) => setNewsTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <textarea
            data-st="field"
            value={newsBody}
            onChange={(e) => setNewsBody(e.target.value)}
            placeholder="Body"
            rows={4}
            required
            className="w-full"
          />
          <Button variant="primary" type="submit" disabled={creatingNews}>
            {creatingNews ? 'Posting…' : 'Post Announcement'}
          </Button>
        </Panel>
      </section>

      {/* Blog posts */}
      <section className="space-y-3">
        <SectionHeading>Blog Posts</SectionHeading>
        {announcementsError ? (
          <Panel className="p-4">
            <p data-st="prose" className="text-sm text-[var(--st-danger)]">
              Failed to load blog posts.
            </p>
          </Panel>
        ) : (
          <DataTable
            columns={blogColumns}
            rows={announcements?.blogPosts as BlogRow[] | undefined}
            rowKey={(b) => b.id}
            isLoading={isLoading}
            empty="No blog posts."
          />
        )}

        <Panel as="form" onSubmit={handleCreateBlog} className="p-4 space-y-3">
          <SectionHeading className="text-xs">Write Blog Post</SectionHeading>
          <Field
            type="text"
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <textarea
            data-st="field"
            value={blogBody}
            onChange={(e) => setBlogBody(e.target.value)}
            placeholder="Body"
            rows={6}
            required
            className="w-full"
          />
          <Button variant="primary" type="submit" disabled={creatingBlog}>
            {creatingBlog ? 'Posting…' : 'Post Blog Entry'}
          </Button>
        </Panel>
      </section>
    </PageShell>
  );
};

export default NewsManager;
