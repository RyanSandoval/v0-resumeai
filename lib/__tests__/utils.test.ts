import { formatDate } from '../utils';

describe('formatDate', () => {
  it('should format a date string correctly', () => {
    const dateString = '2024-07-28T10:00:00.000Z';
    expect(formatDate(dateString)).toBe('July 28, 2024');
  });

  it('should format a timestamp correctly', () => {
    const timestamp = 1722160800000; // Equivalent to 2024-07-28T10:00:00.000Z
    expect(formatDate(timestamp)).toBe('July 28, 2024');
  });
});
