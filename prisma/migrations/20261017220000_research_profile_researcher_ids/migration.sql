-- External researcher identifiers (Google Scholar, Scopus, WoS, ...)
ALTER TABLE "research_profiles" ADD COLUMN "researcherIds" JSONB;
