-- CreateEnum
CREATE TYPE "public"."CommentType" AS ENUM ('COMMENT', 'SUGGESTION', 'QUESTION');

-- CreateEnum
CREATE TYPE "public"."CommentStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DELETED');

-- CreateTable
CREATE TABLE "public"."manuscript_comments" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "type" "public"."CommentType" NOT NULL DEFAULT 'COMMENT',
    "status" "public"."CommentStatus" NOT NULL DEFAULT 'ACTIVE',
    "selectedText" TEXT,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manuscript_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."manuscript_comments" ADD CONSTRAINT "manuscript_comments_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "public"."manuscripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_comments" ADD CONSTRAINT "manuscript_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."manuscript_comments" ADD CONSTRAINT "manuscript_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "public"."manuscript_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
