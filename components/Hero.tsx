import { getTranslationServer } from '@/i18n/server';
import SearchFilters from './SearchFilters';

const Hero = async () => {
  const { t } = await getTranslationServer();

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-nordic leading-tight">
          {t('hero.titlePrefix')}
          <span className="relative inline-block">
            <span className="relative z-10 font-medium">{t('hero.titleSuffix')}</span>
            <span className="absolute bottom-2 left-0 w-full h-3 bg-mosque/20 -rotate-1 z-0"></span>
          </span>
          {t('hero.titlePeriod')}
        </h1>

        <SearchFilters />
      </div>
    </section>
  );
};

export default Hero;
