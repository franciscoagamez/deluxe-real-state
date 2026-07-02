import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapDatabaseProperty } from '@/lib/property-mapper';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyGallery from '@/components/PropertyGallery';
import MortgageCalculator from '@/components/MortgageCalculator';
import PropertyMapWrapper from '@/components/PropertyMapWrapper';

interface PropertyDetailsPageProps {
  params: Promise<{ slug: string }>;
}

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: PropertyDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: p } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!p) {
    return {
      title: 'Property Not Found | LuxeEstate',
    };
  }

  const property = mapDatabaseProperty(p);
  const formattedPrice = property.price.toLocaleString();
  const title = `${property.title} | ${property.location} | LuxeEstate`;
  const description = `${property.beds} Bed, ${property.baths} Bath luxury home in ${property.location} listed for $${formattedPrice}. ${property.description}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: property.images[0] || '' }],
    },
  };
}

export default async function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: p } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!p) {
    notFound();
  }

  const property = mapDatabaseProperty(p);

  // JSON-LD structured data for Schema.org SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    'name': property.title,
    'description': property.description,
    'url': `https://luxeestate.com/properties/${property.slug}`,
    'image': property.images,
    'datePosted': property.created_at,
    'offers': {
      '@type': 'Offer',
      'price': property.price,
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
      'businessFunction': property.type === 'sale' ? 'http://purl.org/goodrelations/v1#Sell' : 'http://purl.org/goodrelations/v1#LeaseOut'
    },
    'about': {
      '@type': 'Residence',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': property.location,
      },
      'numberOfRooms': property.beds + Math.ceil(property.baths),
      'numberOfBedrooms': property.beds,
      'numberOfBathroomsTotal': property.baths,
      'floorSize': {
        '@type': 'QuantitativeValue',
        'value': property.sqft,
        'unitCode': 'MTK'
      }
    }
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Left Column (Gallery) */}
          <div className="lg:col-span-8 space-y-4">
            <PropertyGallery images={property.images} title={property.title} />
          </div>

          {/* Right Column (Sidebar Box with Price, Agent & Map) */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 space-y-6">
              
              {/* Primary Info Box */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-mosque/5">
                <div className="mb-4">
                  <h2 className="text-xl font-display font-medium text-nordic mb-1">
                    {property.title}
                  </h2>
                  <h1 className="text-4xl font-display font-light text-nordic mb-2">
                    ${property.price.toLocaleString()}
                    {property.type === 'rent' && (
                      <span className="text-lg font-normal text-nordic-muted">/mo</span>
                    )}
                  </h1>
                  <p className="text-nordic/60 font-medium flex items-center gap-1">
                    <span className="material-icons text-mosque text-sm">location_on</span>
                    {property.location}
                  </p>
                </div>
                
                <div className="h-px bg-slate-100 my-6"></div>
                
                {/* Agent Detail */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    alt="Sarah Jenkins"
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4TxUmdQRb2VMjuaNxLEwLorv_dgHzoET2_wL5toSvew6nhtziaR3DX-U69DBN7J74yO6oKokpw8tqEFutJf13MeXghCy7FwZuAxnoJel6FYcKeCRUVinpZtrNnkZvXd-MY5_2MAtRD7JP5BieHixfCaeAPW04jm-y-nvF3HIrwcZ_HRDk_MrNP5WiPV3u9zNrEgM-SQoWGh4xLVSV444aZAbVl03mjjsW5WBpIeodCyqJxprTDp6Q157D06VxcdUSCf-l9UKQT-w"
                  />
                  <div>
                    <h3 className="font-semibold text-nordic">Sarah Jenkins</h3>
                    <div className="flex items-center gap-1 text-xs text-mosque font-medium">
                      <span className="material-icons text-[14px]">star</span>
                      <span>Top Rated Agent</span>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button className="p-2 rounded-full bg-mosque/10 text-mosque hover:bg-mosque hover:text-white transition-colors cursor-pointer" aria-label="Chat with agent">
                      <span className="material-icons text-sm">chat</span>
                    </button>
                    <button className="p-2 rounded-full bg-mosque/10 text-mosque hover:bg-mosque hover:text-white transition-colors cursor-pointer" aria-label="Call agent">
                      <span className="material-icons text-sm">call</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button className="w-full bg-mosque hover:bg-primary-hover text-white py-4 px-6 rounded-lg font-medium transition-all shadow-lg shadow-mosque/20 flex items-center justify-center gap-2 group cursor-pointer">
                    <span className="material-icons text-xl group-hover:scale-110 transition-transform">calendar_today</span>
                    Schedule Visit
                  </button>
                  <button className="w-full bg-transparent border border-nordic/10 hover:border-mosque text-nordic/80 hover:text-mosque py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <span className="material-icons text-xl">mail_outline</span>
                    Contact Agent
                  </button>
                </div>
              </div>

              {/* Map Box */}
              {property.latitude && property.longitude && (
                <div className="bg-white p-2 rounded-xl shadow-sm border border-mosque/5 overflow-hidden">
                  <PropertyMapWrapper
                    latitude={property.latitude}
                    longitude={property.longitude}
                    title={property.title}
                    location={property.location}
                  />
                </div>
              )}

            </div>
          </div>

          {/* Left Columns (Details & Text Content) */}
          <div className="lg:col-span-8 lg:row-start-2 -mt-8 space-y-8">
            
            {/* Features Row */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-mosque/5">
              <h2 className="text-lg font-semibold mb-6 text-nordic">Property Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">square_foot</span>
                  <span className="text-xl font-bold text-nordic">{property.sqft}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic/50">Square Meters</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">bed</span>
                  <span className="text-xl font-bold text-nordic">{property.beds}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic/50">Bedrooms</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">shower</span>
                  <span className="text-xl font-bold text-nordic">{property.baths}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic/50">Bathrooms</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">directions_car</span>
                  <span className="text-xl font-bold text-nordic">2</span>
                  <span className="text-xs uppercase tracking-wider text-nordic/50">Garage</span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-mosque/5">
              <h2 className="text-lg font-semibold mb-4 text-nordic">About this home</h2>
              <div className="prose prose-slate max-w-none text-nordic/70 leading-relaxed">
                <p>
                  {property.description || 'Experience luxury living at its finest. This thoughtfully designed residence offers open-concept living spaces, premium finishes, and exceptional comfort in a highly desirable neighborhood. Built with a perfect blend of style and functionality.'}
                </p>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-mosque/5">
              <h2 className="text-lg font-semibold mb-6 text-nordic">Amenities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex items-center gap-3 text-nordic/70">
                  <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                  <span>Smart Home System</span>
                </div>
                <div className="flex items-center gap-3 text-nordic/70">
                  <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                  <span>Swimming Pool</span>
                </div>
                <div className="flex items-center gap-3 text-nordic/70">
                  <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                  <span>Central Heating &amp; Cooling</span>
                </div>
                <div className="flex items-center gap-3 text-nordic/70">
                  <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                  <span>Electric Vehicle Charging</span>
                </div>
                <div className="flex items-center gap-3 text-nordic/70">
                  <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                  <span>Private Gym</span>
                </div>
                <div className="flex items-center gap-3 text-nordic/70">
                  <span className="material-icons text-mosque/60 text-sm">check_circle</span>
                  <span>Wine Cellar</span>
                </div>
              </div>
            </div>

            {/* Mortgage Calculator Section */}
            <MortgageCalculator propertyPrice={property.price} />

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
