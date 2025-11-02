import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const userAccounts = [
  {
    email: 'johndoe@realworld.io',
    username: 'johndoe',
    password: 'johndoe123',
    bio: 'Full-stack developer passionate about clean code and innovative solutions. Love working with modern web technologies.',
    image: null,
    articles: [
      {
        slug: 'how-to-learn-javascript-effectively',
        title: 'How to Learn JavaScript Effectively',
        description:
          'A comprehensive guide to mastering JavaScript from beginner to advanced level',
        body: "Learning JavaScript can be overwhelming with so many resources available. Here's a structured approach that has helped thousands of developers master this essential language.\n\n## Start with the Fundamentals\n\nBefore diving into frameworks, master the core concepts: variables, functions, objects, and arrays. Understanding these building blocks is crucial for writing clean, maintainable code.\n\n## Practice with Real Projects\n\nThe best way to learn is by building actual applications. Start with simple projects like a todo list or calculator, then gradually increase complexity.\n\n## Join the Community\n\nEngage with other developers through forums, Discord servers, and local meetups. The JavaScript community is incredibly welcoming and helpful.",
        tagList: ['beginners', 'javascript', 'programming', 'webdev'],
        favoritedBy: ['mikewilson', 'sarahchen'],
      },
    ],
    comments: [
      {
        slug: 'building-scalable-apis-with-nodejs',
        body: 'Connection pooling made such a difference in my API performance. Great advice!',
      },
      {
        slug: 'react-hooks-best-practices',
        body: 'useEffect dependencies caught me so many times when I was learning React. Wish I had read this earlier!',
      },
    ],
  },
  {
    email: 'janesmith@realworld.io',
    username: 'janesmith',
    password: 'janesmith123',
    bio: 'Frontend developer with a keen eye for UI/UX design. Specializing in React and modern CSS frameworks.',
    image: null,
    articles: [
      {
        slug: 'react-hooks-best-practices',
        title: 'React Hooks: Best Practices and Common Pitfalls',
        description: 'Essential patterns and anti-patterns when working with React Hooks',
        body: "React Hooks have revolutionized how we write React components, but they come with their own set of best practices and potential pitfalls.\n\n## useEffect Dependencies\n\nOne of the most common mistakes is forgetting to include dependencies in the useEffect array. This can lead to stale closures and unexpected behavior.\n\n## Custom Hooks for Reusability\n\nCreate custom hooks to encapsulate stateful logic that can be shared across components. This promotes code reuse and maintainability.\n\n## Performance Considerations\n\nUse useMemo and useCallback judiciously. Don't optimize prematurely, but be aware of when these hooks can help prevent unnecessary re-renders.",
        tagList: ['frontend', 'hooks', 'javascript', 'react'],
        favoritedBy: ['johndoe', 'sarahchen'],
      },
    ],
    comments: [
      {
        slug: 'introduction-to-machine-learning-for-developers',
        body: 'As someone new to ML, this is exactly the kind of practical introduction I was looking for.',
      },
      {
        slug: 'how-to-learn-javascript-effectively',
        body: "Great article! I've been struggling with JavaScript concepts and this really helps clarify things.",
      },
      {
        slug: 'building-scalable-apis-with-nodejs',
        body: 'Error handling is definitely something I need to improve on. Thanks for the practical tips!',
      },
    ],
  },
  {
    email: 'mikewilson@realworld.io',
    username: 'mikewilson',
    password: 'mikewilson123',
    bio: 'Backend engineer focused on scalable architecture and DevOps. Enthusiast of cloud technologies and automation.',
    image: null,
    articles: [
      {
        slug: 'building-scalable-apis-with-nodejs',
        title: 'Building Scalable APIs with Node.js',
        description:
          'Architectural patterns and best practices for creating robust backend services',
        body: 'Building scalable APIs requires careful consideration of architecture, error handling, and performance optimization.\n\n## API Design Principles\n\nFollow RESTful conventions and use appropriate HTTP status codes. Design your API to be intuitive and self-documenting.\n\n## Error Handling Strategy\n\nImplement comprehensive error handling with proper logging and monitoring. Use middleware to handle errors consistently across your application.\n\n## Database Optimization\n\nOptimize database queries and consider implementing caching strategies for frequently accessed data. Connection pooling is essential for production applications.',
        tagList: ['api', 'architecture', 'backend', 'nodejs'],
        favoritedBy: ['janesmith'],
      },
    ],
    comments: [
      {
        slug: 'introduction-to-machine-learning-for-developers',
        body: "The data preprocessing section is spot on. It's definitely where most of the work happens in ML projects.",
      },
      {
        slug: 'how-to-learn-javascript-effectively',
        body: 'The project-based approach really works. I built three projects following this guide and learned so much!',
      },
    ],
  },
  {
    email: 'sarahchen@realworld.io',
    username: 'sarahchen',
    password: 'sarahchen123',
    bio: 'Data scientist and machine learning engineer. Passionate about turning data into actionable insights.',
    image: null,
    articles: [
      {
        slug: 'introduction-to-machine-learning-for-developers',
        description:
          'Getting started with ML concepts and practical applications for software developers',
        title: 'Introduction to Machine Learning for Developers',
        body: "Machine learning might seem intimidating, but it's more accessible than ever for developers looking to expand their skillset.\n\n## Understanding the Basics\n\nStart with supervised learning concepts like classification and regression. These form the foundation for more complex ML algorithms.\n\n## Practical Tools and Libraries\n\nPython's scikit-learn is perfect for beginners, while TensorFlow and PyTorch offer more advanced capabilities for deep learning projects.\n\n## Data Preprocessing\n\nMost of ML work involves cleaning and preparing data. Learn to handle missing values, normalize features, and split datasets properly.",
        tagList: ['ai', 'datascience', 'machinelearning', 'python'],
        favoritedBy: ['johndoe'],
      },
    ],
    comments: [
      {
        slug: 'react-hooks-best-practices',
        body: 'Custom hooks are a game-changer. They make components so much cleaner and more reusable.',
      },
    ],
  },
];

const prisma = new PrismaClient();

async function main() {
  // --- Users ---
  const userMap = new Map<string, { id: number; username: string }>();
  for (const u of userAccounts) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        username: u.username, // keep username in sync if you edit
        bio: u.bio ?? null,
        image: u.image ?? undefined,
        password: passwordHash,
      },
      create: {
        email: u.email,
        username: u.username,
        password: passwordHash,
        bio: u.bio ?? null,
        image: u.image ?? undefined,
      },
      select: { id: true, username: true },
    });
    userMap.set(u.username, user);
  }

  // --- Tags ---
  const allTags = [
    ...new Set(
      userAccounts.flatMap(user => (user.articles ?? []).flatMap(article => article.tagList ?? [])),
    ),
  ];
  if (allTags.length) {
    await prisma.tag.createMany({
      data: allTags.map(name => ({ name })),
      skipDuplicates: true,
    });
  }

  const articleMap = new Map<string, { id: number; slug: string }>();
  for (const u of userAccounts) {
    const author = userMap.get(u.username)!;
    for (const a of u.articles ?? []) {
      const article = await prisma.article.upsert({
        where: { slug: a.slug },
        update: {
          title: a.title,
          description: a.description,
          body: a.body,
          authorId: author.id,
          tagList: { connect: (a.tagList ?? []).map(name => ({ name })) },
        },
        create: {
          slug: a.slug,
          title: a.title,
          description: a.description,
          body: a.body,
          authorId: author.id,
          tagList: { connect: (a.tagList ?? []).map(name => ({ name })) },
        },
        select: { id: true, slug: true },
      });
      articleMap.set(article.slug, article);
    }
  }

  // --- Comments ---
  for (const u of userAccounts) {
    const author = userMap.get(u.username)!;
    for (const c of u.comments ?? []) {
      const art = articleMap.get(c.slug);
      if (!art) continue;
      const existing = await prisma.comment.findFirst({
        where: { authorId: author.id, articleId: art.id, body: c.body },
        select: { id: true },
      });
      if (!existing) {
        await prisma.comment.create({
          data: { body: c.body, authorId: author.id, articleId: art.id },
        });
      }
    }
  }

  // --- Favorites ---
  for (const u of userAccounts) {
    for (const a of u.articles ?? []) {
      for (const favUser of a.favoritedBy ?? []) {
        const liker = userMap.get(favUser);
        const art = articleMap.get(a.slug);
        if (liker && art) {
          await prisma.user.update({
            where: { id: liker.id },
            data: { favorites: { connect: [{ id: art.id }] } },
          });
        }
      }
    }
  }

  console.log('✅ Seed complete:', {
    users: userMap.size,
    tags: allTags.length,
    articles: articleMap.size,
  });
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
