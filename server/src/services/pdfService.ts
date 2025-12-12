/**
 * PDF Service
 * Purpose: Generate PDF documents for reservations
 * Inputs: Reservation data
 * Outputs: PDF buffer
 */

import puppeteer from 'puppeteer'

interface ReservationData {
  id: string
  projectLeaderName: string
  projectLeaderEmail: string
  projectLeaderPhone: string
  entity?: string
  department?: string
  entityDepartment: string
  submissionDate: string
  createdAt?: string
  eventTitle: string
  eventDescription: string
  eventType: string
  eventTypes: string[]
  relevantCommittee: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  estimatedDuration?: string
  locationType: string
  locationName: string
  campusId: string
  buildingId?: string
  locationId?: string
  openSpaceId?: string
  hasPreviousEdition: boolean
  previousEditionYear: string
  previousEditionDetails: string
  participantCount: string
  mediaVisibility: string
  hasVIPGuests: boolean
  vipGuestsDetails: string
  mainObjectives: string[]
  mainObjectivesOther?: string
  secondaryObjectives: string[]
  geographicalScope: string[]
  expectedImpact: string[]
  targetProfiles: string[]
  expectedParticipants: number
  expectedParticipantCount?: string
  eventManager: string
  eventManagerName?: string
  eventManagerPosition?: string
  eventManagerContact?: string
  organizingCommittee: string[]
  associatedPartners: string
  protocolSupportRequired: boolean
  protocolSupport: string
  programFormat: string[]
  speakersStatus: string
  speakersDetails: string
  sideActivities: string[]
  requiredSpaces: string[]
  requiredEquipment: string[]
  transportAccommodationDetails: string
  otherNeeds: string
  communicationObjectives: string[]
  plannedActions: string[]
  visibilityLevel: string[]
  estimatedBudget: string
  agencyEstimate: string
  cateringEstimate: string
  transportEstimate: string
  accommodationEstimate: string
  flightEstimate: string
  overallEstimate: string
  fundingSources: string[]
  estimatedSponsorship: string
  budgetComments: string
  status: string
  validationStatus?: string
  committeeComments: string
  reviewNotes: string
  documents?: string
  approvedBy?: string
  approvedByUser?: { name: string; email: string }
  selectedLocationName?: string
  campus?: { name: string }
  building?: { name: string }
  location?: { name: string }
  openSpace?: { name: string }
}

export class PdfService {
  /**
   * Get logo as base64
   * Purpose: Read logo file and convert to base64 for embedding in PDF
   * Output: Base64 string
   */
  private getLogoBase64(): string {
    try {
      const fs = require('fs')
      const path = require('path')
      const logoPath = path.join(process.cwd(), 'server', 'public', 'um6p-logo.png')
      const logoBuffer = fs.readFileSync(logoPath)
      return `data:image/png;base64,${logoBuffer.toString('base64')}`
    } catch (error) {
      console.error('Failed to read logo file:', error)
      return ''
    }
  }

  /**
   * Generate PDF for reservation
   * Purpose: Create a filled PDF form with all reservation details
   * Inputs: Reservation data object
   * Outputs: PDF buffer
   */
  async generateReservationPDF(reservation: ReservationData): Promise<Buffer> {
    console.log('Starting PDF generation for reservation:', reservation.id)
    
    let browser
    try {
      const html = this.generateHTML(reservation)
      console.log('HTML generated, launching browser...')
      
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      })
      console.log('Browser launched successfully')

      const page = await browser.newPage()
      console.log('New page created, setting content...')
      
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      })
      console.log('Content set, generating PDF...')
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })
      console.log('PDF generated successfully, size:', pdfBuffer.length)

      return Buffer.from(pdfBuffer)
    } catch (error: any) {
      console.error('Error generating PDF:', error.message)
      console.error('Stack:', error.stack)
      throw new Error(`PDF generation failed: ${error.message}`)
    } finally {
      if (browser) {
        await browser.close()
        console.log('Browser closed')
      }
    }
  }

  /**
   * Generate HTML template
   * Purpose: Create HTML with filled form data
   * Inputs: Reservation data
   * Outputs: HTML string
   */
  private generateHTML(data: ReservationData): string {
    const parseArray = this.parseArray.bind(this)
    const logoBase64 = this.getLogoBase64()
    
    // Get venue information
    const venueInfo = this.getVenueInfo(data)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation Details - ${data.eventTitle}</title>
    <style>
        @media print {
            body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f9fafb;
            padding: 0;
            margin: 0;
        }
        .page-header {
            background: white;
            border-bottom: 3px solid #F44A1A;
            padding: 1.5rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
        }
        .page-header img {
            height: 60px;
            width: auto;
        }
        .page-header-text {
            flex: 1;
            text-align: center;
        }
        .page-header-text h1 {
            font-size: 1.75rem;
            font-weight: bold;
            color: #111827;
            margin: 0;
        }
        .page-header-text p {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0.5rem 0 0 0;
        }
        .page-header-spacer {
            width: 60px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem 2rem 2rem;
        }
        .card {
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .card-header {
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.125rem;
            font-weight: 600;
            background: linear-gradient(to right, #fed7aa, #ffedd5);
            color: #c2410c;
        }
        .card-content {
            padding: 1.5rem;
        }
        .field-group {
            margin-bottom: 1rem;
        }
        .field-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
            display: block;
        }
        .field-value {
            font-size: 0.875rem;
            color: #111827;
            font-weight: 500;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
        }
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            background: #f3f4f6;
            color: #374151;
        }
        .badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .committee-member {
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border-left: 3px solid #F44A1A;
            margin-bottom: 0.75rem;
        }
        .signature-section {
            background: white;
            border: 2px dashed #F44A1A;
            border-radius: 0.75rem;
            padding: 2rem;
            margin-top: 2rem;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .signature-section h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #111827;
            margin-bottom: 2rem;
        }
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin-bottom: 2rem;
        }
        .signature-box {
            border-bottom: 2px solid #F44A1A;
            min-height: 80px;
            margin-bottom: 0.5rem;
        }
        .signature-label {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 1rem;
        }
        .signature-info {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.5rem;
        }
        .document-info {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid #e5e7eb;
            font-size: 0.75rem;
            color: #9ca3af;
        }
        @media print {
            body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            .card {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .signature-section {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <!-- Header on all pages -->
    <div class="page-header">
        <img src="${logoBase64}" alt="UM6P Logo">
        <div class="page-header-text">
            <h1>${data.eventTitle}</h1>
            <p>Event Reservation Application</p>
        </div>
        <div class="page-header-spacer"></div>
    </div>
    
    <div class="container">

        <!-- 1. Applicant Information -->
        <div class="card">
            <div class="card-header">
                Applicant Information
            </div>
            <div class="card-content">
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Project Leader</span>
                        <div class="field-value">${data.projectLeaderName || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Email</span>
                        <div class="field-value">${data.projectLeaderEmail || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Phone</span>
                        <div class="field-value">${data.projectLeaderPhone || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Entity</span>
                        <div class="field-value">${data.entity || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Department</span>
                        <div class="field-value">${data.department || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Submission Date</span>
                        <div class="field-value">${data.submissionDate ? new Date(data.submissionDate).toLocaleDateString() : (data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A')}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. Event Details -->
        <div class="card">
            <div class="card-header">
                Event Details
            </div>
            <div class="card-content">
                <div class="field-group">
                    <span class="field-label">Description</span>
                    <div class="field-value">${data.eventDescription || 'No description provided'}</div>
                </div>
                <div class="grid-3">
                    <div class="field-group">
                        <span class="field-label">Event Type</span>
                        <div class="badge">${data.eventType || 'N/A'}</div>
                    </div>
                    ${parseArray(data.eventTypes).length > 0 ? `
                    <div class="field-group">
                        <span class="field-label">Event Categories</span>
                        <div class="badge-list">
                            ${parseArray(data.eventTypes).map(type => `<span class="badge">${type}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    <div class="field-group">
                        <span class="field-label">Committee</span>
                        <div class="field-value">${data.relevantCommittee || 'N/A'}</div>
                    </div>
                </div>
                ${data.relevantCommittee ? `
                <div class="field-group">
                    <span class="field-label">Committee Contact Details</span>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #F44A1A;">
                        ${data.relevantCommittee === 'institutional' ? `
                            <div style="margin-bottom: 0.5rem;">
                                <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">☐ Institutional</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Mr. Ahmed LAZRAK – Contact: ahmed.lazrak@um6p.ma</div>
                            </div>
                        ` : data.relevantCommittee === 'scientific' ? `
                            <div style="margin-bottom: 0.5rem;">
                                <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">☐ Scientific & Research</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Mr. Hicham El Gourgue – Contact: hicham.gourgue@um6p.ma</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Mr. Alami Jones – Contact: jones.alami@um6p.ma</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                <div class="grid-2">
                </div>
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Start</span>
                        <div class="field-value">${data.startDate ? new Date(data.startDate).toLocaleDateString() : 'N/A'} ${data.startTime || ''}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">End</span>
                        <div class="field-value">${data.endDate ? new Date(data.endDate).toLocaleDateString() : 'N/A'} ${data.endTime || ''}</div>
                    </div>
                </div>
                <div class="field-group">
                    <span class="field-label">Estimated Duration</span>
                    <div class="field-value">${data.estimatedDuration || 'N/A'}</div>
                </div>
                <div class="field-group">
                    <span class="field-label">Venue</span>
                    <div class="field-value">${venueInfo}</div>
                </div>
            </div>
        </div>

        <!-- 3. Event History & Impact -->
        <div class="card">
            <div class="card-header">
                Event History & Impact
            </div>
            <div class="card-content">
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Previous Edition</span>
                        <div class="field-value">${data.hasPreviousEdition ? `Yes (${data.previousEditionYear || 'N/A'})` : 'No'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Participant Count</span>
                        <div class="field-value">${data.participantCount || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Media Visibility</span>
                        <div class="badge">${data.mediaVisibility || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">VIP Guests</span>
                        <div class="field-value">${data.hasVIPGuests ? 'Yes' : 'No'}</div>
                    </div>
                </div>
                ${data.vipGuestsDetails ? `
                <div class="field-group">
                    <span class="field-label">VIP Details</span>
                    <div class="field-value" style="white-space: pre-line;">${data.vipGuestsDetails}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- 4. Objectives & Scope -->
        <div class="card">
            <div class="card-header">
                Objectives & Scope
            </div>
            <div class="card-content">
                <div class="field-group">
                    <span class="field-label">Main Objectives</span>
                    <div class="badge-list">
                        ${parseArray(data.mainObjectives).map(obj => `<span class="badge">${obj}</span>`).join('')}
                    </div>
                </div>
                ${data.mainObjectivesOther ? `
                <div class="field-group">
                    <span class="field-label">Other Main Objectives</span>
                    <div class="field-value">${data.mainObjectivesOther}</div>
                </div>
                ` : ''}
                <div class="field-group">
                    <span class="field-label">Secondary Objectives</span>
                    <div class="badge-list">
                        ${parseArray(data.secondaryObjectives).map(obj => `<span class="badge">${obj}</span>`).join('')}
                    </div>
                </div>
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Geographical Scope</span>
                        <div class="badge-list">
                            ${parseArray(data.geographicalScope).map(scope => `<span class="badge">${scope}</span>`).join('')}
                        </div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Expected Impact</span>
                        <div class="badge-list">
                            ${parseArray(data.expectedImpact).map(impact => `<span class="badge">${impact}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 5. Target Audience -->
        <div class="card">
            <div class="card-header">
                Target Audience
            </div>
            <div class="card-content">
                <div class="field-group">
                    <span class="field-label">Target Profiles</span>
                    <div class="badge-list">
                        ${parseArray(data.targetProfiles).map(profile => `<span class="badge">${profile}</span>`).join('')}
                    </div>
                </div>
                <div class="field-group">
                    <span class="field-label">Expected Number of Participants</span>
                    <div class="field-value">${data.expectedParticipantCount || data.expectedParticipants || 'N/A'}</div>
                </div>
            </div>
        </div>

        <!-- 6. Governance & Partners -->
        <div class="card">
            <div class="card-header">
                Governance & Partners
            </div>
            <div class="card-content">
                ${data.eventManagerName ? `
                <div class="field-group">
                    <span class="field-label">Event Manager</span>
                    <div class="committee-member">
                        <div class="field-value">${data.eventManagerName}</div>
                        ${data.eventManagerPosition ? `<div class="field-label" style="margin-top: 0.25rem;">${data.eventManagerPosition}</div>` : ''}
                        ${data.eventManagerContact ? `<div class="field-label" style="margin-top: 0.25rem;">${data.eventManagerContact}</div>` : ''}
                    </div>
                </div>
                ` : ''}
                ${parseArray(data.organizingCommittee).length > 0 ? `
                <div class="field-group">
                    <span class="field-label">Organizing Committee</span>
                    ${parseArray(data.organizingCommittee).map((member: any) => {
                        if (typeof member === 'object') {
                            return `<div class="committee-member">
                                <div class="field-value">${member.name || 'N/A'}</div>
                                <div class="field-label" style="margin-top: 0.25rem;">${member.role || 'N/A'} - ${member.entity || 'N/A'}</div>
                            </div>`
                        }
                        return `<div class="committee-member"><div class="field-value">${member}</div></div>`
                    }).join('')}
                </div>
                ` : ''}
                <div class="field-group">
                    <span class="field-label">Associated Partners</span>
                    <div class="field-value">${data.associatedPartners || 'N/A'}</div>
                </div>
                <div class="field-group">
                    <span class="field-label">Protocol Support Required</span>
                    <div class="field-value">${data.protocolSupportRequired ? 'Yes' : 'No'}</div>
                </div>
                ${data.protocolSupport && parseArray(data.protocolSupport).length > 0 ? `
                <div class="field-group">
                    <span class="field-label">Protocol Support Areas</span>
                    <div class="badge-list">
                        ${parseArray(data.protocolSupport).map(area => `<span class="badge">${area}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- 7. Program & Logistics -->
        <div class="card">
            <div class="card-header">
                Program & Logistics
            </div>
            <div class="card-content">
                <div class="field-group">
                    <span class="field-label">Program Format</span>
                    <div class="badge-list">
                        ${parseArray(data.programFormat).map(format => `<span class="badge">${format}</span>`).join('')}
                    </div>
                </div>
                <div class="field-group">
                    <span class="field-label">Speakers Status</span>
                    <div class="field-value">${data.speakersStatus || 'N/A'}</div>
                </div>
                ${data.speakersDetails ? `
                <div class="field-group">
                    <span class="field-label">Speaker Details</span>
                    <div class="field-value">${data.speakersDetails}</div>
                </div>
                ` : ''}
                <div class="field-group">
                    <span class="field-label">Side Activities</span>
                    <div class="badge-list">
                        ${parseArray(data.sideActivities).map(activity => `<span class="badge">${activity}</span>`).join('')}
                    </div>
                </div>
                <div class="field-group">
                    <span class="field-label">Required Equipment</span>
                    <div class="badge-list">
                        ${parseArray(data.requiredEquipment).map(equipment => `<span class="badge">${equipment}</span>`).join('')}
                    </div>
                </div>
                <div class="field-group">
                    <span class="field-label">Transport, Accommodation & Catering</span>
                    <div class="field-value">${data.transportAccommodationDetails || 'N/A'}</div>
                </div>
                ${data.otherNeeds ? `
                <div class="field-group">
                    <span class="field-label">Other Needs</span>
                    <div class="field-value">${data.otherNeeds}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- 8. Communication & Visibility -->
        <div class="card">
            <div class="card-header">
                Communication & Visibility
            </div>
            <div class="card-content">
                <div class="field-group">
                    <span class="field-label">Communication Objectives</span>
                    <div class="badge-list">
                        ${parseArray(data.communicationObjectives).map(obj => `<span class="badge">${obj}</span>`).join('')}
                    </div>
                </div>
                <div class="field-group">
                    <span class="field-label">Planned Actions</span>
                    <div class="badge-list">
                        ${parseArray(data.plannedActions).map(action => `<span class="badge">${action}</span>`).join('')}
                    </div>
                </div>
                ${parseArray(data.visibilityLevel).length > 0 ? `
                <div class="field-group">
                    <span class="field-label">Expected Visibility Level</span>
                    <div class="badge-list">
                        ${parseArray(data.visibilityLevel).map(level => `<span class="badge">${level}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- 9. Budget -->
        <div class="card">
            <div class="card-header">
                Budget
            </div>
            <div class="card-content">
                <div class="grid-3">
                    <div class="field-group">
                        <span class="field-label">Overall Estimate</span>
                        <div class="field-value">${data.overallEstimate || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Estimated Sponsorship</span>
                        <div class="field-value">${data.estimatedSponsorship || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Agency Estimate</span>
                        <div class="field-value">${data.agencyEstimate || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid-3">
                    <div class="field-group">
                        <span class="field-label">Catering</span>
                        <div class="field-value">${data.cateringEstimate || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Transport</span>
                        <div class="field-value">${data.transportEstimate || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Accommodation</span>
                        <div class="field-value">${data.accommodationEstimate || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid-3">
                    <div class="field-group">
                        <span class="field-label">Flight Estimate</span>
                        <div class="field-value">${data.flightEstimate || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Budget Estimate</span>
                        <div class="field-value">${data.estimatedBudget || 'N/A'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Total Budget</span>
                        <div class="field-value">${data.overallEstimate || 'N/A'}</div>
                    </div>
                </div>
                <div class="field-group">
                    <span class="field-label">Funding Sources</span>
                    <div class="badge-list">
                        ${parseArray(data.fundingSources).map(source => `<span class="badge">${source}</span>`).join('')}
                    </div>
                </div>
                ${data.budgetComments ? `
                <div class="field-group">
                    <span class="field-label">Comments</span>
                    <div class="field-value">${data.budgetComments}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- 10. Provided Documents -->
        ${data.documents && parseArray(data.documents).length > 0 ? `
        <div class="card">
            <div class="card-header">
                Provided Documents
            </div>
            <div class="card-content">
                <div class="field-group">
                    <span class="field-label">Uploaded Documents</span>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${parseArray(data.documents).map((doc: any) => {
                            const docObj = typeof doc === 'string' ? JSON.parse(doc) : doc;
                            return `
                            <div style="padding: 0.5rem; background: #f9fafb; border-radius: 0.375rem; border-left: 3px solid #F44A1A;">
                                <span style="font-size: 0.875rem; color: #374151; font-weight: 500;">📄 ${docObj.name || docObj}</span>
                                ${docObj.type ? `<span style="font-size: 0.75rem; color: #9ca3af; margin-left: 0.5rem;">(${docObj.type})</span>` : ''}
                            </div>
                        `}).join('')}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- 11. Validation & Follow-up -->
        <div class="card">
            <div class="card-header">
                Validation & Follow-up
            </div>
            <div class="card-content">
                <div class="grid-2">
                    <div class="field-group">
                        <span class="field-label">Status</span>
                        <div class="badge">${data.status || 'PENDING'}</div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">Validation Status</span>
                        <div class="field-value">${data.validationStatus || 'N/A'}</div>
                    </div>
                </div>
                ${data.committeeComments ? `
                <div class="field-group">
                    <span class="field-label">Committee Comments</span>
                    <div class="field-value">${data.committeeComments}</div>
                </div>
                ` : ''}
                ${data.reviewNotes ? `
                <div class="field-group">
                    <span class="field-label">Review Notes</span>
                    <div class="field-value">${data.reviewNotes}</div>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <h2>Signatures</h2>
            
            <div class="signature-grid">
                <div>
                    <div class="signature-label">Project Leader Signature:</div>
                    <div class="signature-box"></div>
                    <div class="signature-info">Name: ${data.projectLeaderName || '_______________'}</div>
                    <div class="signature-info">Date: _______________</div>
                </div>
                
                <div>
                    <div class="signature-label">Committee Representative Signature:</div>
                    <div class="signature-box"></div>
                    <div class="signature-info">Name: ${data.approvedByUser?.name || data.approvedBy || '_______________'}</div>
                    <div class="signature-info">Date: _______________</div>
                </div>
            </div>
            
            <div class="document-info">
                <p>This document was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                <p>Reservation ID: ${data.id}</p>
            </div>
        </div>

    </div>
</body>
</html>
    `
  }

  /**
   * Helper method to parse array fields
   */
  private parseArray(field: any): any[] {
    if (!field) return []
    if (Array.isArray(field)) return field
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field)
        return Array.isArray(parsed) ? parsed : [field]
      } catch {
        return [field]
      }
    }
    return []
  }

  /**
   * Get venue information
   */
  private getVenueInfo(data: ReservationData): string {
    const parts: string[] = []
    
    // Add campus name
    if (data.campus?.name) {
      parts.push(data.campus.name)
    }
    
    // Add selected location name
    if (data.selectedLocationName) {
      parts.push(data.selectedLocationName)
    }
    
    // Add building name if different from selected location
    if (data.building?.name && data.building.name !== data.selectedLocationName) {
      parts.push(data.building.name)
    }
    
    // Add location name if different from selected location
    if (data.location?.name && data.location.name !== data.selectedLocationName) {
      parts.push(data.location.name)
    }
    
    // Add open space name if different from selected location
    if (data.openSpace?.name && data.openSpace.name !== data.selectedLocationName) {
      parts.push(data.openSpace.name)
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'Not specified'
  }
}

export const pdfService = new PdfService()
