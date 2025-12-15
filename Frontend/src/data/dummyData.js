export const dummyVisas = [
  {
    id: 1,
    name: 'Tourist Visa',
    country: 'United Kingdom',
    type: 'Tourist',
    duration: '6 months',
    processingTime: '15-20 days',
    cost: '$150',
    matchScore: 95,
    description: 'Perfect for short-term visits, tourism, and visiting family or friends.',
    requirements: [
      'Valid passport (minimum 6 months validity)',
      'Proof of accommodation',
      'Travel itinerary',
      'Bank statements (last 3 months)',
      'Travel insurance',
      'Return flight tickets'
    ],
    eligibility: [
      'No criminal record',
      'Sufficient funds for stay',
      'Strong ties to home country',
      'Clear travel purpose'
    ]
  },
  {
    id: 2,
    name: 'Work Visa',
    country: 'Canada',
    type: 'Work',
    duration: '2 years',
    processingTime: '8-12 weeks',
    cost: '$500',
    matchScore: 88,
    description: 'Ideal for skilled professionals with job offers in Canada.',
    requirements: [
      'Job offer from Canadian employer',
      'LMIA (Labour Market Impact Assessment)',
      'Educational credentials assessment',
      'Language proficiency test (IELTS/CELPIP)',
      'Medical examination',
      'Police clearance certificate',
      'Proof of work experience'
    ],
    eligibility: [
      'Valid job offer',
      'Relevant work experience',
      'Language proficiency',
      'Medical clearance',
      'No criminal record'
    ]
  },
  {
    id: 3,
    name: 'Student Visa',
    country: 'Australia',
    type: 'Student',
    duration: 'Duration of course',
    processingTime: '4-6 weeks',
    cost: '$620',
    matchScore: 82,
    description: 'For international students enrolled in Australian educational institutions.',
    requirements: [
      'Confirmation of Enrollment (CoE)',
      'Genuine Temporary Entrant (GTE) statement',
      'Financial capacity proof',
      'English language proficiency',
      'Health insurance (OSHC)',
      'Academic transcripts',
      'Passport and photos'
    ],
    eligibility: [
      'Accepted to Australian institution',
      'Sufficient funds',
      'English proficiency',
      'Health insurance',
      'Genuine student intent'
    ]
  },
  {
    id: 4,
    name: 'Business Visa',
    country: 'United States',
    type: 'Business',
    duration: '10 years (multiple entry)',
    processingTime: '2-3 weeks',
    cost: '$185',
    matchScore: 75,
    description: 'B-1 visa for business visitors attending meetings, conferences, or negotiations.',
    requirements: [
      'Business invitation letter',
      'Proof of business activities',
      'Financial documents',
      'Travel itinerary',
      'Previous travel history',
      'Ties to home country'
    ],
    eligibility: [
      'Legitimate business purpose',
      'No intent to work in US',
      'Sufficient funds',
      'Strong home country ties'
    ]
  }
]

export const dummyUserRecommendations = [
  {
    id: 1,
    visaId: 1,
    visaName: 'Tourist Visa - UK',
    status: 'in_progress',
    progress: 65,
    createdAt: '2024-01-15',
    nextStep: 'Submit bank statements',
    documentsSubmitted: 4,
    documentsTotal: 6
  },
  {
    id: 2,
    visaId: 2,
    visaName: 'Work Visa - Canada',
    status: 'not_started',
    progress: 0,
    createdAt: '2024-01-20',
    nextStep: 'Obtain job offer',
    documentsSubmitted: 0,
    documentsTotal: 7
  }
]

export const dummyDocuments = [
  {
    id: 1,
    name: 'Passport.pdf',
    type: 'Passport',
    size: '2.4 MB',
    uploadedAt: '2024-01-15',
    status: 'verified',
    visaId: 1
  },
  {
    id: 2,
    name: 'Bank_Statement_Jan.pdf',
    type: 'Bank Statement',
    size: '1.8 MB',
    uploadedAt: '2024-01-16',
    status: 'pending',
    visaId: 1
  },
  {
    id: 3,
    name: 'Travel_Insurance.pdf',
    type: 'Travel Insurance',
    size: '950 KB',
    uploadedAt: '2024-01-17',
    status: 'verified',
    visaId: 1
  },
  {
    id: 4,
    name: 'Flight_Tickets.pdf',
    type: 'Flight Tickets',
    size: '1.2 MB',
    uploadedAt: '2024-01-18',
    status: 'verified',
    visaId: 1
  },
  {
    id: 5,
    name: 'Accommodation_Booking.pdf',
    type: 'Accommodation',
    size: '890 KB',
    uploadedAt: '2024-01-19',
    status: 'pending',
    visaId: 1
  }
]

export const dummyChecklistItems = {
  1: [
    { id: 1, title: 'Valid passport (minimum 6 months validity)', completed: true, required: true },
    { id: 2, title: 'Proof of accommodation', completed: false, required: true },
    { id: 3, title: 'Travel itinerary', completed: true, required: true },
    { id: 4, title: 'Bank statements (last 3 months)', completed: false, required: true },
    { id: 5, title: 'Travel insurance', completed: true, required: true },
    { id: 6, title: 'Return flight tickets', completed: true, required: true }
  ],
  2: [
    { id: 1, title: 'Job offer from Canadian employer', completed: false, required: true },
    { id: 2, title: 'LMIA (Labour Market Impact Assessment)', completed: false, required: true },
    { id: 3, title: 'Educational credentials assessment', completed: false, required: true },
    { id: 4, title: 'Language proficiency test (IELTS/CELPIP)', completed: false, required: true },
    { id: 5, title: 'Medical examination', completed: false, required: true },
    { id: 6, title: 'Police clearance certificate', completed: false, required: true },
    { id: 7, title: 'Proof of work experience', completed: false, required: true }
  ]
}

