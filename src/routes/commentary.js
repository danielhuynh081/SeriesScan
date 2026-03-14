import {Router} from 'express';
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
    // 1. Validate req.params using matchIdParamSchema and req.query using listCommentaryQuerySchema
    const paramParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
        return res.status(400).json({
            message: 'Invalid match ID',
            details: paramParsed.error.issues
        });
    }

    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
        return res.status(400).json({
            message: 'Invalid query parameters',
            details: queryParsed.error.issues
        });
    }

    // 4. apply a limit based on the query parameter (Defaulting to 100 with a max_limit safety cap)
    const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);

    try {
        // 2. Fetch data from the "commentary" table where "matchId" equals the ID from params.
        // 3. order the results by "createdAt" in descending order so the newest events come first.
        const results = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, paramParsed.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({ data: results });
    } catch (error) {
        // 5. use ES modules and handle errors with try/catch
        console.error('Failed to fetch commentary:', error);
        res.status(500).json({ error: 'Failed to fetch commentary' });
    }
});

commentaryRouter.post('/', async (req, res) => {
    const paramParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
        return res.status(400).json({
            message: 'Invalid match ID',
            details: paramParsed.error.issues
        });
    }

    // 2. Validate req.body using createCommentarySchema
    // Inject matchId from params into body for validation if necessary,
    // or validate them separately as requested.
    // The createCommentarySchema expects matchId in the body according to its definition.
    const bodyData = { ...req.body, matchId: paramParsed.data.id };
    const bodyParsed = createCommentarySchema.safeParse(bodyData);
    
    if (!bodyParsed.success) {
        return res.status(400).json({
            message: 'Invalid request body',
            details: bodyParsed.error.issues
        });
    }

    try {
        // 3. Insert the data into the commentary table and return the result
        const [newCommentary] = await db
            .insert(commentary)
            .values(bodyParsed.data)
            .returning();

        res.status(201).json({ data: newCommentary });
    } catch (error) {
        console.error('Failed to create commentary:', error);
        res.status(500).json({ error: 'Failed to create commentary' });
    }
});

