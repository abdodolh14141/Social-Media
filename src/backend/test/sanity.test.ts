import { describe, expect, it } from 'bun:test';

describe('Backend Sanity Check', () => {
    it('should return welcome message', async () => {
        const response = await fetch('http://localhost:4000/');
        expect(response.status).toBe(200);
        const text = await response.text();
        expect(text).toContain('Elysia Backend Running');
    });
});
