
import { generateSchema } from '../utils';

describe('generateSchema', () => {
  it('should generate a valid JSON schema for a simple JSON object', () => {
    const json = {
      name: 'John Doe',
      age: 30,
      isStudent: false,
    };

    const expectedSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        isStudent: { type: 'boolean' },
      },
    };

    const result = generateSchema(json);
    expect(result).toEqual(expectedSchema);
  });

  it('should handle nested objects', () => {
    const json = {
      person: {
        name: 'John Doe',
        age: 30,
      },
    };

    const expectedSchema = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
          },
        },
      },
    };

    const result = generateSchema(json);
    expect(result).toEqual(expectedSchema);
  });

  it('should handle arrays', () => {
    const json = {
      items: [1, 2, 3],
    };

    const expectedSchema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'integer',
          },
        },
      },
    };

    const result = generateSchema(json);
    expect(result).toEqual(expectedSchema);
  });
});
