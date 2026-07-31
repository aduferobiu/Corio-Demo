import bcrypt from 'bcryptjs'

import { db } from './client'
import { comments, customers, documents, loanApplications, users } from './schema'

const DEMO_PASSWORDS = {
  loan_officer: '12345',
  branch_officer: '12345',
  credit_officer: '12345',
  md: '12345',
} as const

async function seed() {
  const [loanOfficerHash, branchOfficerHash, creditOfficerHash, mdHash] = await Promise.all([
    bcrypt.hash(DEMO_PASSWORDS.loan_officer, 10),
    bcrypt.hash(DEMO_PASSWORDS.branch_officer, 10),
    bcrypt.hash(DEMO_PASSWORDS.credit_officer, 10),
    bcrypt.hash(DEMO_PASSWORDS.md, 10),
  ])

  const [loanOfficer, branchOfficer, creditOfficer, md] = await db
    .insert(users)
    .values([
      { name: 'Chidinma Okafor', email: 'loan.officer@corio.demo', passwordHash: loanOfficerHash, role: 'loan_officer', branch: 'Lagos Mainland' },
      { name: 'Emeka Nwosu', email: 'branch.officer@corio.demo', passwordHash: branchOfficerHash, role: 'branch_officer', branch: 'Lagos Mainland' },
      { name: 'Amaka Bello', email: 'credit.officer@corio.demo', passwordHash: creditOfficerHash, role: 'credit_officer', branch: 'Lagos Mainland' },
      { name: 'Tunde Adebayo', email: 'md@corio.demo', passwordHash: mdHash, role: 'md', branch: null },
    ])
    .returning()

  const now = Date.now()
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000)

  const [
    custBisi,
    custSegun,
    custChukwuemeka,
    custFatima,
    custYusuf,
    custNgozi,
    custIbrahim,
    custChiamaka,
  ] = await db
    .insert(customers)
    .values([
      {
        fullName: 'Bisi Adeyemi',
        phoneNumber: '+234 801 234 5678',
        address: '12 Marina Street, Lagos Island',
        bvn: '22345678901',
        nin: '32345678901',
        employmentType: 'employed',
        employerName: 'Federal Ministry of Finance',
        monthlyIncome: 250_000,
        guarantorName: 'Ngozi Eze',
        guarantorPhone: '+234 802 345 6789',
        createdByUserId: loanOfficer.id,
      },
      {
        fullName: 'Segun Balogun',
        phoneNumber: '+234 802 987 6543',
        address: '8 Balogun Market Road, Lagos Island',
        bvn: '22345678902',
        nin: '32345678902',
        employmentType: 'self_employed',
        businessName: 'Balogun General Merchandise',
        monthlyIncome: 280_000,
        guarantorName: 'Kemi Balogun',
        guarantorPhone: '+234 802 111 2233',
        createdByUserId: loanOfficer.id,
      },
      {
        fullName: 'Chukwuemeka Eze',
        phoneNumber: '0803 123 4567',
        address: '12 Marina Street, Lagos Island',
        bvn: '22345678903',
        nin: '32345678903',
        employmentType: 'employed',
        employerName: 'Federal Ministry of Finance',
        monthlyIncome: 385_000,
        guarantorName: 'Ngozi Eze',
        guarantorPhone: '0809 987 6543',
        createdByUserId: loanOfficer.id,
      },
      {
        fullName: 'Fatima Suleiman',
        phoneNumber: '+234 804 456 7890',
        address: '3 Awolowo Road, Ikoyi',
        bvn: '22345678904',
        nin: '32345678904',
        employmentType: 'employed',
        employerName: 'Lagos State Ministry of Health',
        monthlyIncome: 260_000,
        guarantorName: 'Aisha Suleiman',
        guarantorPhone: '+234 804 555 6677',
        createdByUserId: loanOfficer.id,
      },
      {
        fullName: 'Yusuf Ibrahim',
        phoneNumber: '+234 803 456 7890',
        address: '4 Balogun Market Road, Lagos Island',
        bvn: '22345678905',
        nin: '32345678905',
        employmentType: 'self_employed',
        businessName: 'Ibrahim Textiles & General Trading',
        monthlyIncome: 420_000,
        guarantorName: 'Aisha Ibrahim',
        guarantorPhone: '+234 803 111 2222',
        createdByUserId: loanOfficer.id,
      },
      {
        fullName: 'Ngozi Obi',
        phoneNumber: '+234 805 222 3344',
        address: '19 Allen Avenue, Ikeja',
        bvn: '22345678906',
        nin: '32345678906',
        employmentType: 'self_employed',
        businessName: 'Obi Event Rentals',
        monthlyIncome: 300_000,
        guarantorName: 'Peter Obi Nnamdi',
        guarantorPhone: '+234 805 333 4455',
        createdByUserId: loanOfficer.id,
      },
      {
        fullName: 'Ibrahim Musa',
        phoneNumber: '+234 806 555 6677',
        address: '7 Yaba College Road, Yaba',
        bvn: '22345678907',
        nin: '32345678907',
        employmentType: 'employed',
        employerName: 'Lagos State Ministry of Education',
        monthlyIncome: 180_000,
        guarantorName: 'Hauwa Musa',
        guarantorPhone: '+234 806 777 8899',
        createdByUserId: loanOfficer.id,
      },
      {
        fullName: 'Chiamaka Eze',
        phoneNumber: '+234 807 888 9900',
        address: '25 Adeola Odeku Street, Victoria Island',
        bvn: '22345678908',
        nin: '32345678908',
        employmentType: 'employed',
        employerName: 'Zenith Bank Plc',
        monthlyIncome: 520_000,
        guarantorName: 'Obinna Eze',
        guarantorPhone: '+234 807 999 0011',
        createdByUserId: loanOfficer.id,
      },
    ])
    .returning()

  const [appSubmitted, appQueried, appWithCredit, appApproved, appWithCredit2, appRejected, appDeclined, appSubmitted2] = await db
    .insert(loanApplications)
    .values([
      {
        referenceNumber: 'COR-2026-00845',
        customerId: custBisi.id,
        applicantName: 'Bisi Adeyemi',
        applicantPhone: '+234 801 234 5678',
        applicantAddress: '12 Marina Street, Lagos Island',
        bvn: '22345678901',
        employmentType: 'employed',
        employerName: 'Federal Ministry of Finance',
        monthlyIncome: 250_000,
        guarantorName: 'Ngozi Eze',
        guarantorPhone: '+234 802 345 6789',
        loanType: 'personal_loan',
        amountRequested: 300_000,
        loanPurpose: 'Working capital for retail business',
        loanDurationMonths: 6,
        interestRateBps: 125,
        totalAmountDue: 420_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'submitted',
        submittedAt: hoursAgo(2),
      },
      {
        referenceNumber: 'COR-2026-00846',
        customerId: custSegun.id,
        applicantName: 'Segun Balogun',
        applicantPhone: '+234 802 987 6543',
        applicantAddress: '8 Balogun Market Road, Lagos Island',
        bvn: '22345678902',
        employmentType: 'self_employed',
        businessName: 'Balogun General Merchandise',
        monthlyIncome: 280_000,
        guarantorName: 'Kemi Balogun',
        guarantorPhone: '+234 802 111 2233',
        loanType: 'business_loan',
        amountRequested: 400_000,
        loanPurpose: 'Restocking general merchandise ahead of festive season',
        loanDurationMonths: 6,
        interestRateBps: 125,
        totalAmountDue: 560_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'queried',
        submittedAt: hoursAgo(30),
      },
      {
        referenceNumber: 'COR-2026-00847',
        customerId: custChukwuemeka.id,
        applicantName: 'Chukwuemeka Eze',
        applicantPhone: '0803 123 4567',
        applicantAddress: '12 Marina Street, Lagos Island',
        bvn: '22345678903',
        employmentType: 'employed',
        employerName: 'Federal Ministry of Finance',
        monthlyIncome: 385_000,
        guarantorName: 'Ngozi Eze',
        guarantorPhone: '0809 987 6543',
        loanType: 'personal_loan',
        amountRequested: 500_000,
        loanPurpose: 'Business expansion and working capital',
        loanDurationMonths: 5,
        interestRateBps: 125,
        totalAmountDue: 700_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'with_credit',
        submittedAt: hoursAgo(3),
      },
      {
        referenceNumber: 'COR-2026-00848',
        customerId: custFatima.id,
        applicantName: 'Fatima Suleiman',
        applicantPhone: '+234 804 456 7890',
        applicantAddress: '3 Awolowo Road, Ikoyi',
        bvn: '22345678904',
        employmentType: 'employed',
        employerName: 'Lagos State Ministry of Health',
        monthlyIncome: 260_000,
        guarantorName: 'Aisha Suleiman',
        guarantorPhone: '+234 804 555 6677',
        loanType: 'personal_loan',
        amountRequested: 250_000,
        loanPurpose: 'Medical expenses',
        loanDurationMonths: 6,
        interestRateBps: 125,
        totalAmountDue: 350_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'approved',
        submittedAt: hoursAgo(72),
        decidedAt: hoursAgo(24),
        decidedByUserId: creditOfficer.id,
        decisionNotes: 'Stable civil service income, clean statement history. Approved as requested.',
      },
      {
        referenceNumber: 'COR-2026-00849',
        customerId: custYusuf.id,
        applicantName: 'Yusuf Ibrahim',
        applicantPhone: '+234 803 456 7890',
        applicantAddress: '4 Balogun Market Road, Lagos Island',
        bvn: '22345678905',
        employmentType: 'self_employed',
        businessName: 'Ibrahim Textiles & General Trading',
        monthlyIncome: 420_000,
        guarantorName: 'Aisha Ibrahim',
        guarantorPhone: '+234 803 111 2222',
        loanType: 'business_loan',
        amountRequested: 650_000,
        loanPurpose: 'Restocking imported fabric ahead of the Q1 wholesale season',
        loanDurationMonths: 9,
        interestRateBps: 125,
        totalAmountDue: 856_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'with_credit',
        submittedAt: hoursAgo(4),
      },
      {
        referenceNumber: 'COR-2026-00850',
        customerId: custNgozi.id,
        applicantName: 'Ngozi Obi',
        applicantPhone: '+234 805 222 3344',
        applicantAddress: '19 Allen Avenue, Ikeja',
        bvn: '22345678906',
        employmentType: 'self_employed',
        businessName: 'Obi Event Rentals',
        monthlyIncome: 300_000,
        guarantorName: 'Peter Obi Nnamdi',
        guarantorPhone: '+234 805 333 4455',
        loanType: 'business_loan',
        amountRequested: 800_000,
        loanPurpose: 'Purchase of additional event equipment and a delivery van',
        loanDurationMonths: 12,
        interestRateBps: 125,
        totalAmountDue: 1_040_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'rejected',
        submittedAt: hoursAgo(72),
        decidedAt: hoursAgo(20),
        decidedByUserId: creditOfficer.id,
        decisionNotes:
          'Requested amount is disproportionate to verified monthly turnover, and the last 3 months of statements show two returned direct debits. Recommend the applicant reapply for a smaller facility once the existing personal loan is cleared, with at least 6 months of clean statement history.',
      },
      {
        referenceNumber: 'COR-2026-00851',
        customerId: custIbrahim.id,
        applicantName: 'Ibrahim Musa',
        applicantPhone: '+234 806 555 6677',
        applicantAddress: '7 Yaba College Road, Yaba',
        bvn: '22345678907',
        employmentType: 'employed',
        employerName: 'Lagos State Ministry of Education',
        monthlyIncome: 180_000,
        guarantorName: 'Hauwa Musa',
        guarantorPhone: '+234 806 777 8899',
        loanType: 'personal_loan',
        amountRequested: 150_000,
        loanPurpose: "Children's school fees for the new term",
        loanDurationMonths: 4,
        interestRateBps: 125,
        totalAmountDue: 180_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'declined',
        submittedAt: hoursAgo(120),
        decidedAt: hoursAgo(96),
        decidedByUserId: branchOfficer.id,
        decisionNotes:
          'Declined at branch stage: applicant already has two active salary-advance deductions on file, leaving insufficient net income to service a new facility this term.',
      },
      {
        referenceNumber: 'COR-2026-00852',
        customerId: custChiamaka.id,
        applicantName: 'Chiamaka Eze',
        applicantPhone: '+234 807 888 9900',
        applicantAddress: '25 Adeola Odeku Street, Victoria Island',
        bvn: '22345678908',
        employmentType: 'employed',
        employerName: 'Zenith Bank Plc',
        monthlyIncome: 520_000,
        guarantorName: 'Obinna Eze',
        guarantorPhone: '+234 807 999 0011',
        loanType: 'personal_loan',
        amountRequested: 350_000,
        loanPurpose: 'Consolidating two smaller high-interest debts into a single lower-rate facility',
        loanDurationMonths: 8,
        interestRateBps: 125,
        totalAmountDue: 385_000,
        branch: 'Lagos Mainland',
        createdByUserId: loanOfficer.id,
        status: 'submitted',
        submittedAt: hoursAgo(0.5),
      },
    ])
    .returning()

  // A long, realistic back-and-forth demonstrating the query/response thread comfortably
  // supports long, multi-paragraph messages.
  await db.insert(comments).values([
    {
      loanApplicationId: appQueried.id,
      authorUserId: branchOfficer.id,
      type: 'query',
      body: `Before I can move this forward, I need a few things clarified:

1. The BVN on file (22345678902) doesn't fully match the name spelling on the submitted National ID — please confirm which is correct and re-upload if needed.
2. The bank statement covers only 6 weeks, not the required 3 months. Can the applicant provide statements going back further, ideally covering the last quarter?
3. The stated business ("general merchandise trading") doesn't have any CAC registration document attached — is this a registered business, and if so, please attach the certificate.

Happy to move quickly once these are sorted — the applicant seems to have a reasonable repayment history otherwise.`,
    },
    {
      loanApplicationId: appQueried.id,
      authorUserId: loanOfficer.id,
      type: 'response',
      body: `Thanks for flagging these — I've followed up with the applicant directly:

1. Confirmed the correct spelling is "Segun Balogun" as on the ID; the BVN record has an old middle name that the bank is aware of and is in the process of correcting. I can request a BVN validation slip from his bank if that helps.
2. He's since gone back to his bank branch and requested a full 3-month statement — should have it within 2 working days, I'll upload as soon as it lands.
3. The business is currently unregistered — he operates as a sole trader without formal CAC registration. He's open to registering it if that's a hard requirement, but it would take a few weeks. Let me know if that changes anything on your end, or if we should proceed on the strength of his personal income and guarantor instead.

I'll chase the updated statement and get back to you as soon as I have it.`,
    },
  ])

  await db.insert(documents).values([
    {
      loanApplicationId: appWithCredit.id,
      uploadedByUserId: loanOfficer.id,
      fileName: 'Bank_Statement_Chukwuemeka_Eze_3M.pdf',
      storedPath: 'seed/bank_statement_analysis.pdf',
      mimeType: 'application/pdf',
      fileSize: 204_800,
      documentType: 'Bank Statement',
    },
    {
      loanApplicationId: appWithCredit2.id,
      uploadedByUserId: loanOfficer.id,
      fileName: 'Bank_Statement_Yusuf_Ibrahim_3M.pdf',
      storedPath: 'seed/bank_statement_yusuf.pdf',
      mimeType: 'application/pdf',
      fileSize: 187_400,
      documentType: 'Bank Statement',
    },
  ])

  console.log('Seeded users and passwords:', {
    loanOfficer: { email: loanOfficer.email, password: DEMO_PASSWORDS.loan_officer },
    branchOfficer: { email: branchOfficer.email, password: DEMO_PASSWORDS.branch_officer },
    creditOfficer: { email: creditOfficer.email, password: DEMO_PASSWORDS.credit_officer },
    md: { email: md.email, password: DEMO_PASSWORDS.md },
  })
  console.log(
    'Seeded applications:',
    [appSubmitted, appQueried, appWithCredit, appApproved, appWithCredit2, appRejected, appDeclined, appSubmitted2].map(
      (a) => `${a.referenceNumber} (${a.status})`,
    ),
  )
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
