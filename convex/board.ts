import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAllOrThrow } from "convex-helpers/server/relationships";

const images = [
  "/placeholders/1.svg",
  "/placeholders/2.svg",
  "/placeholders/3.svg",
  "/placeholders/4.svg",
  "/placeholders/5.svg",
  "/placeholders/6.svg",
  "/placeholders/7.svg",
  "/placeholders/8.svg",
  "/placeholders/9.svg",
  "/placeholders/10.svg"
];

////

export const create = mutation({
  args: {
    orgId: v.string(),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("403: Unauthorized");

    const randomImage = images[Math.floor(Math.random() * images.length)];
    console.log(randomImage, "TEST");

    const board = await ctx.db.insert("Board", {
      title: args.title,
      orgId: args.orgId,
      authorId: identity.subject,
      authorName: identity.name!,
      imageUrl: randomImage
    });

    return board;
  }
});

////

export const remove = mutation({
  args: {
    id: v.id("Board")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("403: Unauthorized");
    const userId = identity.subject;

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) => q.eq("userId", userId).eq("boardId", args.id))
      .unique();
    if (existingFavorite) await ctx.db.delete(existingFavorite._id);

    await ctx.db.delete(args.id);
  }
});

////

export const update = mutation({
  args: {
    id: v.id("Board"),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("403: Unauthorized");

    const title = args.title.trim();
    if (!title) throw new Error("400: Title is required");
    if (title.length > 60) throw new Error("400: Title cannot be longer than 60 characters");

    const board = await ctx.db.patch(args.id, {
      title: args.title
    });

    return board;
  }
});

////

export const favorite = mutation({
  args: {
    id: v.id("Board"),
    orgId: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("403: Unauthorized");
    const userId = identity.subject;

    const board = await ctx.db.get(args.id);
    if (!board) throw new Error("404: Board not found");

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) => q.eq("userId", userId).eq("boardId", board._id))
      .unique();
    if (existingFavorite) throw new Error("409: Board already favorited");

    await ctx.db.insert("userFavorites", {
      userId,
      boardId: board._id,
      orgId: args.orgId
    });

    return board;
  }
});

////

export const unfavorite = mutation({
  args: {
    id: v.id("Board")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("403: Unauthorized");
    const userId = identity.subject;

    const board = await ctx.db.get(args.id);
    if (!board) throw new Error("404: Board not found");

    const existingFavorite = await ctx.db
      .query("userFavorites")
      .withIndex("by_user_board", (q) => q.eq("userId", userId).eq("boardId", board._id))
      .unique();
    if (!existingFavorite) throw new Error("404: Favorited board not found");

    await ctx.db.delete(existingFavorite._id);

    return board;
  }
});

////

export const getById = query({
  args: {
    id: v.id("Board")
  },
  handler: async (ctx, args) => {
    const board = ctx.db.get(args.id);

    return board;
  }
});

////

export const getMany = query({
  args: {
    orgId: v.string(),
    search: v.optional(v.string()),
    favorites: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("403: Unauthorized");

    if (args.favorites) {
      const favoritedBoard = await ctx.db
        .query("userFavorites")
        .withIndex("by_user_org", (q) => q.eq("userId", identity.subject).eq("orgId", args.orgId))
        .order("desc")
        .collect();

      const ids = favoritedBoard.map((b) => b.boardId);

      const Board = await getAllOrThrow(ctx.db, ids);

      return Board.map((board) => ({
        ...board,
        isFavorite: true
      }));
    }

    const title = args.search as string;
    let Board = [];

    if (title) {
      Board = await ctx.db
        .query("Board")
        .withSearchIndex("search_title", (q) => q.search("title", title).eq("orgId", args.orgId))
        .collect();
    } else {
      Board = await ctx.db
        .query("Board")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .order("desc")
        .collect();
    }

    const BoardWithFavoriteRelation = Board.map((board) => {
      return ctx.db
        .query("userFavorites")
        .withIndex("by_user_board", (q) => q.eq("userId", identity.subject).eq("boardId", board._id))
        .unique()
        .then((favorite) => {
          return {
            ...board,
            isFavorite: !!favorite
          };
        });
    });

    const BoardWithFavoriteBoolean = Promise.all(BoardWithFavoriteRelation);

    return BoardWithFavoriteBoolean;
  }
});
