import { jest } from '@jest/globals';

describe('Simple Test Suite', () => {
    test('should pass basic test', () => {
        expect(1 + 1).toBe(2);
    });

    test('should handle basic math', () => {
        expect(5 * 3).toBe(15);
        expect(10 / 2).toBe(5);
        expect(7 - 3).toBe(4);
    });

    test('should work with strings', () => {
        expect('hello' + ' world').toBe('hello world');
        expect('test'.length).toBe(4);
    });

    test('should work with arrays', () => {
        const arr = [1, 2, 3, 4, 5];
        expect(arr.length).toBe(5);
        expect(arr[0]).toBe(1);
        expect(arr[arr.length - 1]).toBe(5);
    });

    test('should work with objects', () => {
        const obj = { name: 'test', value: 42 };
        expect(obj.name).toBe('test');
        expect(obj.value).toBe(42);
        expect(Object.keys(obj)).toHaveLength(2);
    });

    test('should handle async operations', async () => {
        const result = await Promise.resolve('success');
        expect(result).toBe('success');
    });

    test('should handle errors gracefully', () => {
        expect(() => {
            throw new Error('test error');
        }).toThrow('test error');
    });
});
