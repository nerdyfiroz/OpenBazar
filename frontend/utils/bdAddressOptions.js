export const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
];

export const BANGLADESH_DISTRICTS = {
  Dhaka: [
    'Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj', 'Munshiganj', 'Madaripur',
    'Faridpur', 'Gopalganj', 'Kishoreganj', 'Tangail', 'Shariatpur', 'Rajbari'
  ],
  Chattogram: [
    'Chattogram', 'Cox\'s Bazar', 'Cumilla', 'Noakhali', 'Feni', 'Brahmanbaria',
    'Chandpur', 'Lakshmipur', 'Rangamati', 'Khagrachhari', 'Bandarban'
  ],
  Rajshahi: [
    'Rajshahi', 'Bogra', 'Sirajganj', 'Naogaon', 'Natore', 'Pabna', 'Joypurhat', 'Chapainawabganj'
  ],
  Khulna: [
    'Khulna', 'Jashore', 'Satkhira', 'Kushtia', 'Bagerhat', 'Chuadanga', 'Meherpur', 'Narail', 'Magura', 'Jhenaidah'
  ],
  Barishal: [
    'Barishal', 'Patuakhali', 'Pirojpur', 'Bhola', 'Jhalokati', 'Barguna'
  ],
  Sylhet: [
    'Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'
  ],
  Rangpur: [
    'Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'
  ],
  Mymensingh: [
    'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'
  ]
};

export const BANGLADESH_UPAZILAS = {
  Dhaka: ['Savar', 'Dhamrai', 'Keraniganj', 'Nawabganj', 'Dohar', 'Adabor', 'Tejgaon', 'Gulshan'],
  Gazipur: ['Gazipur Sadar', 'Kaliakair', 'Sreepur', 'Kapasia', 'Kaliganj'],
  Narayanganj: ['Narayanganj Sadar', 'Araihazar', 'Bandar', 'Rupganj', 'Sonargaon'],
  Narsingdi: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
  Manikganj: ['Manikganj Sadar', 'Saturia', 'Shibalaya', 'Singair', 'Ghior', 'Harirampur'],
  Munshiganj: ['Munshiganj Sadar', 'Sirajdikhan', 'Tongibari', 'Gazaria', 'Lohajang', 'Sreenagar'],
  Mymensingh: ['Mymensingh Sadar', 'Bhaluka', 'Trishal', 'Muktagachha', 'Gafargaon', 'Nandail'],
  Chattogram: ['Patenga', 'Pahartali', 'Double Mooring', 'Kotwali', 'Bayezid'],
  "Cox's Bazar": ['Cox\'s Bazar Sadar', 'Teknaf', 'Ukhia', 'Ramu', 'Chakaria'],
  Cumilla: ['Cumilla Sadar', 'Daudkandi', 'Laksam', 'Debidwar', 'Muradnagar', 'Barura'],
  Noakhali: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya'],
  Feni: ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Sonagazi', 'Parshuram'],
  Rajshahi: ['Rajshahi Sadar', 'Paba', 'Durgapur', 'Mohonpur', 'Charghat'],
  Bogra: ['Bogra Sadar', 'Sariakandi', 'Shajahanpur', 'Dhunat', 'Gabtali', 'Sherpur'],
  Khulna: ['Khulna Sadar', 'Dumuria', 'Batiaghata', 'Dacope', 'Paikgachha'],
  Jashore: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Keshabpur', 'Monirampur'],
  Barishal: ['Barishal Sadar', 'Bakerganj', 'Banaripara', 'Gournadi', 'Wazirpur'],
  Patuakhali: ['Patuakhali Sadar', 'Bauphal', 'Galachipa', 'Dashmina', 'Kalapara'],
  Sylhet: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Bishwanath', 'Fenchuganj'],
  Moulvibazar: ['Moulvibazar Sadar', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
  Rangpur: ['Rangpur Sadar', 'Badarganj', 'Mithapukur', 'Pirganj', 'Kaunia'],
  Dinajpur: ['Dinajpur Sadar', 'Birganj', 'Birampur', 'Parbatipur', 'Nawabganj'],
  Jamalpur: ['Jamalpur Sadar', 'Melandaha', 'Islampur', 'Sarishabari', 'Madarganj'],
  Netrokona: ['Netrokona Sadar', 'Barhatta', 'Durgapur', 'Kendua', 'Madan']
};

export const BANGLADESH_AREAS = ['City corporation area', 'Municipality area', 'Union area', 'Village area', 'Market area', 'Residential area'];

export const getDistrictOptions = (division) => BANGLADESH_DISTRICTS[division] || [];
export const getUpazilaOptions = (district) => BANGLADESH_UPAZILAS[district] || [];
