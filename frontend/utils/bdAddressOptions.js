export const BANGLADESH_DIVISIONS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'
];

export const BANGLADESH_DISTRICTS = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj', 'Munshiganj', 'Madaripur', 'Faridpur', 'Gopalganj', 'Kishoreganj', 'Tangail', 'Shariatpur', 'Rajbari'],
  Chattogram: ['Chattogram', "Cox's Bazar", 'Cumilla', 'Noakhali', 'Feni', 'Brahmanbaria', 'Chandpur', 'Lakshmipur', 'Rangamati', 'Khagrachhari', 'Bandarban'],
  Rajshahi: ['Rajshahi', 'Bogra', 'Sirajganj', 'Naogaon', 'Natore', 'Pabna', 'Joypurhat', 'Chapainawabganj'],
  Khulna: ['Khulna', 'Jashore', 'Satkhira', 'Kushtia', 'Bagerhat', 'Chuadanga', 'Meherpur', 'Narail', 'Magura', 'Jhenaidah'],
  Barishal: ['Barishal', 'Patuakhali', 'Pirojpur', 'Bhola', 'Jhalokati', 'Barguna'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur']
};

// All upazilas per district
export const BANGLADESH_UPAZILAS = {
  // === DHAKA ===
  Dhaka: ['Adabor', 'Badda', 'Bangshal', 'Cantonment', 'Chackbazar', 'Demra', 'Dhamrai', 'Dhanmondi', 'Dohar', 'Gendaria', 'Gulshan', 'Hazaribagh', 'Kadamtali', 'Kafrul', 'Kalabagan', 'Keraniganj', 'Khilgaon', 'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Nawabganj', 'New Market', 'Pallabi', 'Paltan', 'Ramna', 'Rayer Bazar', 'Sabujbagh', 'Savar', 'Shah Ali', 'Shahjahanpur', 'Shyampur', 'Sutrapur', 'Tejgaon', 'Turag', 'Uttara', 'Wari'],
  Gazipur: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Kaliganj', 'Sreepur'],
  Narayanganj: ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon'],
  Narsingdi: ['Belabo', 'Monohardi', 'Narsingdi Sadar', 'Palash', 'Raipura', 'Shibpur'],
  Manikganj: ['Daulatpur', 'Ghior', 'Harirampur', 'Manikganj Sadar', 'Saturia', 'Shibalaya', 'Singair'],
  Munshiganj: ['Gazaria', 'Lohajang', 'Munshiganj Sadar', 'Sirajdikhan', 'Sreenagar', 'Tongibari'],
  Madaripur: ['Kalkini', 'Madaripur Sadar', 'Rajoir', 'Shibchar'],
  Faridpur: ['Alfadanga', 'Bhanga', 'Boalmari', 'Char Bhadrasan', 'Faridpur Sadar', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
  Gopalganj: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  Kishoreganj: ['Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kishoreganj Sadar', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
  Tangail: ['Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Tangail Sadar'],
  Shariatpur: ['Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Shariatpur Sadar', 'Zajira'],
  Rajbari: ['Baliakandi', 'Goalanda', 'Kalukhali', 'Pangsha', 'Rajbari Sadar'],

  // === CHATTOGRAM ===
  Chattogram: ['Anwara', 'Banshkhali', 'Bayazid', 'Boalkhali', 'Chandgaon', 'Chittagong Port', 'Doublemooring', 'Hathazari', 'Khulshi', 'Kotwali', 'Lohagara', 'Mirsharai', 'Pahartali', 'Panchlaish', 'Patiya', 'Potenga', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 'Sitakunda'],
  "Cox's Bazar": ["Cox's Bazar Sadar", 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Pekua', 'Ramu', 'Teknaf', 'Ukhia'],
  Cumilla: ['Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Cumilla Sadar', 'Cumilla Sadar South', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Lalmai', 'Meghna', 'Monohorgonj', 'Muradnagar', 'Nangalkot', 'Titas'],
  Noakhali: ['Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Kabirhat', 'Noakhali Sadar', 'Senbagh', 'Sonaimuri', 'Subarnachar'],
  Feni: ['Chhagalnaiya', 'Daganbhuiyan', 'Feni Sadar', 'Parshuram', 'Sonagazi', 'Fulgazi'],
  Brahmanbaria: ['Akhaura', 'Ashuganj', 'Bancharampur', 'Bijoynagar', 'Brahmanbaria Sadar', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail'],
  Chandpur: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab North', 'Matlab South', 'Shahrasti'],
  Lakshmipur: ['Kamalnagar', 'Lakshmipur Sadar', 'Ramganj', 'Ramgati', 'Roypur'],
  Rangamati: ['Baghaichhari', 'Barkal', 'Belaichhari', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali', 'Rangamati Sadar'],
  Khagrachhari: ['Dighinala', 'Khagrachhari Sadar', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh'],
  Bandarban: ['Alikadam', 'Bandarban Sadar', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],

  // === RAJSHAHI ===
  Rajshahi: ['Bagha', 'Bagmara', 'Boalia', 'Charghat', 'Durgapur', 'Godagari', 'Matihar', 'Mohonpur', 'Paba', 'Puthia', 'Rajpara', 'Shah Makhdum', 'Tanore'],
  Bogra: ['Adamdighi', 'Bogra Sadar', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'],
  Sirajganj: ['Belkuchi', 'Chauhali', 'Kamarkhand', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Sirajganj Sadar', 'Tarash', 'Ullahpara'],
  Naogaon: ['Atrai', 'Badalgachhi', 'Dhamoirhat', 'Mahadebpur', 'Manda', 'Mohadevpur', 'Naogaon Sadar', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
  Natore: ['Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Natore Sadar', 'Singra'],
  Pabna: ['Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Pabna Sadar', 'Santhia', 'Sujanagar'],
  Joypurhat: ['Akkelpur', 'Joypurhat Sadar', 'Khetlal', 'Panchbibi', 'Kalai'],
  Chapainawabganj: ['Bholahat', 'Chapainawabganj Sadar', 'Gomastapur', 'Nachole', 'Shibganj'],

  // === KHULNA ===
  Khulna: ['Batiaghata', 'Dacope', 'Daulatpur', 'Dighalia', 'Dumuria', 'Khan Jahan Ali', 'Khulna Sadar', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsa', 'Sonadanga', 'Terokhada'],
  Jashore: ['Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jashore Sadar', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
  Satkhira: ['Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Satkhira Sadar', 'Shyamnagar', 'Tala'],
  Kushtia: ['Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Kushtia Sadar', 'Mirpur'],
  Bagerhat: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sharankhola'],
  Chuadanga: ['Alamdanga', 'Chuadanga Sadar', 'Damurhuda', 'Jibannagar'],
  Meherpur: ['Gangni', 'Meherpur Sadar', 'Mujibnagar'],
  Narail: ['Kalia', 'Lohagara', 'Narail Sadar'],
  Magura: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
  Jhenaidah: ['Harinakunda', 'Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],

  // === BARISHAL ===
  Barishal: ['Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Barishal Sadar', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'],
  Patuakhali: ['Bauphal', 'Dashmina', 'Dumki', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Patuakhali Sadar', 'Rangabali'],
  Pirojpur: ['Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad', 'Pirojpur Sadar', 'Zianagar'],
  Bhola: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
  Jhalokati: ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
  Barguna: ['Amtali', 'Bamna', 'Barguna Sadar', 'Betagi', 'Patharghata', 'Taltali'],

  // === SYLHET ===
  Sylhet: ['Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Dakshin Surma', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar', 'Sylhet Sadar', 'Zakiganj'],
  Moulvibazar: ['Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Moulvibazar Sadar', 'Rajnagar', 'Sreemangal'],
  Habiganj: ['Ajmiriganj', 'Baniachong', 'Bahubal', 'Chunarughat', 'Habiganj Sadar', 'Lakhai', 'Madhabpur', 'Nabiganj'],
  Sunamganj: ['Bishwamvarpur', 'Chhatak', 'Derai', 'Dharampasha', 'Dowarabazar', 'Jamalganj', 'Sulla', 'Sunamganj Sadar', 'Shalla', 'Tahirpur'],

  // === RANGPUR ===
  Rangpur: ['Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Rangpur Sadar', 'Taraganj'],
  Dinajpur: ['Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Dinajpur Sadar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
  Kurigram: ['Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Fulbari', 'Kurigram Sadar', 'Nageshwari', 'Phulbari', 'Rajarhat', 'Raumari', 'Ulipur'],
  Gaibandha: ['Fulchhari', 'Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'],
  Lalmonirhat: ['Aditmari', 'Hatibandha', 'Kaliganj', 'Lalmonirhat Sadar', 'Patgram'],
  Nilphamari: ['Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Nilphamari Sadar', 'Saidpur'],
  Panchagarh: ['Atwari', 'Boda', 'Debiganj', 'Panchagarh Sadar', 'Tetulia'],
  Thakurgaon: ['Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail', 'Thakurgaon Sadar'],

  // === MYMENSINGH ===
  Mymensingh: ['Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Mymensingh Sadar', 'Nandail', 'Phulpur', 'Trishal'],
  Jamalpur: ['Bakshiganj', 'Dewanganj', 'Islampur', 'Jamalpur Sadar', 'Madarganj', 'Melandaha', 'Sarishabari'],
  Netrokona: ['Atpara', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Kendua', 'Khaliajuri', 'Madan', 'Mohanganj', 'Netrokona Sadar', 'Purbadhala'],
  Sherpur: ['Jhenaigati', 'Nakla', 'Nalitabari', 'Sherpur Sadar', 'Sribordi']
};

// Unions per upazila — verified official data (rangpur.gov.bd, wikipedia, banglapedia)
export const BANGLADESH_UNIONS = {
  // Dhaka district
  Savar: ['Savar Paurashava', 'Ashulia', 'Dhamsona', 'Bongaon', 'Yearpur', 'Shimulia', 'Pathalia', 'Kaundia', 'Tepirbari'],
  Dhamrai: ['Dhamrai Paurashava', 'Baisakanda', 'Gandia', 'Jadabpur', 'Kushura', 'Nannor', 'Row', 'Sanora', 'Suapur'],
  Keraniganj: ['Keraniganj Paurashava', 'Aganagar', 'Basta', 'Hasnabad', 'Kalindi', 'Konda', 'Ruhitpur', 'Shubhadya', 'Teghoria'],
  'Gazipur Sadar': ['Gazipur City Corporation', 'Basan', 'Gazipur', 'Konabari', 'Mirchapur', 'Pubail'],
  Kaliakair: ['Kaliakair Paurashava', 'Baroibari', 'Chappari', 'Dhala', 'Full Baria', 'Mouchak', 'Shafipur'],
  Sreepur: ['Sreepur Paurashava', 'Barmi', 'Gosinga', 'Maona', 'Rajabari', 'Telihati', 'Prohladpur'],
  'Narayanganj Sadar': ['Narayanganj City Corporation', 'Boro Bandar', 'Fatullah', 'Kalagachhia', 'Shiddhirganj'],
  Rupganj: ['Bhulta', 'Golakandail', 'Kayetpara', 'Murapara', 'Rapura', 'Rupganj Paurashava', 'Tarab'],
  // Chattogram
  'Chattogram Sadar': ['Chattogram City Corporation'],
  Hathazari: ['Hathazari Paurashava', 'Burthaiya', 'Chatkhali', 'Fatehpur', 'Forhadabad', 'Goria', 'Harua', 'Madunaghat', 'Mekhala', 'Mirkhadam', 'Nalap'],
  Patiya: ['Patiya Paurashava', 'Anwara', 'Bhatikhain', 'Chorwara', 'Jhilwanja', 'Kharana', 'Kusumpur'],
  // Sylhet
  'Sylhet Sadar': ['Sylhet City Corporation', 'Akhalia', 'Kandigaon', 'Khadadim', 'Moghbazar', 'Tuker Bazar'],
  Beanibazar: ['Beanibazar Paurashava', 'Asampara', 'Dobirbazar', 'Kumarpara', 'Lama Kazi', 'Mulugul', 'Tilpara', 'Mathiura'],
  Golapganj: ['Golapganj Paurashava', 'Bhadeshwar', 'Dhaka Dakshin', 'Fultala', 'Lakshmi Pasha', 'Sharifalikhapur'],
  // Rajshahi
  'Rajshahi Sadar': ['Rajshahi City Corporation', 'Baragachhi', 'Dargapara', 'Haragram', 'Kashiadanga', 'Nodda', 'Pakuria'],
  Paba: ['Bausha', 'Darikumra', 'Haripur', 'Hujuripara', 'Nohaata', 'Parila'],
  // Khulna
  'Khulna Sadar': ['Khulna City Corporation', 'Arongghata', 'Dumuria', 'Dighalia'],
  Dumuria: ['Atra', 'Dumuria Paurashava', 'Ghna', 'Magurakhali', 'Rajghat', 'Saras', 'Shantipur'],
  // Barishal
  'Barishal Sadar': ['Barishal City Corporation', 'Airport', 'Barguna', 'Chandpura', 'Charbaria', 'Charmonai'],
  Bakerganj: ['Bakerganj Paurashava', 'Baukati', 'Calshira', 'Chakhar', 'Charami', 'Garuriya', 'Madhava Pasha', 'Naltona'],
  // Mymensingh
  'Mymensingh Sadar': ['Mymensingh City Corporation', 'Akua', 'Borar Char', 'Char Ishwardia', 'Dapunia', 'Kewatkhali', 'Khagdhar', 'Paranganj', 'Shambhuganj'],
  Bhaluka: ['Bhaluka Paurashava', 'Birunia', 'Dhitrakondi', 'Kayeda', 'Khamardia', 'Meduary', 'Rajoi', 'Uchakhila'],
  Trishal: ['Dhanikhola', 'Harirampur', 'Kaladaha', 'Kanthal', 'Matlhab', 'Mathbari', 'Sakhua', 'Trishal Paurashava'],
  // Dinajpur
  'Dinajpur Sadar': ['Dinajpur Paurashava', 'Auliapur', 'Chehelegazi', 'Fazilpur', 'Mahabbatpur', 'Newabganj', 'Shakhahar', 'Sundarpur'],
  Birganj: ['Bhognagar', 'Birganj Paurashava', 'Mohamudpur', 'Muraripur', 'Nandanpur', 'Pohail', 'Satail'],
  // Kurigram
  'Kurigram Sadar': ['Kurigram Paurashava', 'Balaganj', 'Belgacha', 'Ghoraghat', 'Hogolbaria', 'Panchgachhi', 'Yatrapur', 'Zighabhanga']
};

// Area types (kept for backward compatibility)
export const BANGLADESH_AREAS = [
  'City Corporation Area',
  'Municipality (Paurashava) Area',
  'Union Area',
  'Village Area',
  'Market Area',
  'Residential Area',
  'Industrial Area'
];

export const getDistrictOptions = (division) => BANGLADESH_DISTRICTS[division] || [];
export const getUpazilaOptions = (district) => BANGLADESH_UPAZILAS[district] || [];
export const getUnionOptions = (upazila) => BANGLADESH_UNIONS[upazila] || [];
