import NodeCache from 'node-cache';

// Cache instance with default TTL of 5 minutes (300 seconds)
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const CACHE_KEYS = {
  PUBLISHED_TESTS: (limit: number, offset: number) => `published_tests_${limit}_${offset}`,
  TEST_BY_ID: (id: string) => `test_${id}`,
  TEST_WITH_SECTIONS: (id: string) => `test_sections_${id}`,
  SECTION_QUESTIONS: (sectionId: string) => `section_questions_${sectionId}`,
};

export function clearTestCaches() {
  const keys = cache.keys();
  const testKeys = keys.filter(k => k.startsWith('published_tests_') || k.startsWith('test_') || k.startsWith('test_sections_'));
  cache.del(testKeys);
}

export function clearSectionCache(sectionId: string) {
  cache.del(CACHE_KEYS.SECTION_QUESTIONS(sectionId));
}
