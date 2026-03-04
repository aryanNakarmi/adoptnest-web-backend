import { AnimalReportRepository } from '../../../repositories/animalreport.repository';
import { AnimalReportModel } from '../../../models/animalreport.model';

jest.mock('../../../models/animalreport.model');

const mockReport = { _id: 'report123', species: 'Cat', status: 'pending', description: 'Found stray cat', location: { address: 'Downtown', lat: 27.7, lng: 85.3 }, imageUrl: '/reports/cat.jpg', reportedBy: 'user123' };

describe('AnimalReportRepository - Unit Tests', () => {
  let repo: AnimalReportRepository;
  beforeEach(() => { repo = new AnimalReportRepository(); jest.clearAllMocks(); });

  describe('createReport', () => {
    it('creates and saves a report', async () => {
      const save = jest.fn().mockResolvedValue(mockReport);
      (AnimalReportModel as any).mockImplementation(() => ({ save }));
      expect(await repo.createReport({ species: 'Cat', reportedBy: 'user123' })).toEqual(mockReport);
      expect(save).toHaveBeenCalledTimes(1);
    });
    it('throws if save fails', async () => {
      (AnimalReportModel as any).mockImplementation(() => ({ save: jest.fn().mockRejectedValue(new Error('DB error')) }));
      await expect(repo.createReport({})).rejects.toThrow('DB error');
    });
  });

  describe('getReportById', () => {
    it('returns report with populated reportedBy', async () => {
      (AnimalReportModel.findById as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(mockReport) });
      expect(await repo.getReportById('report123')).toEqual(mockReport);
    });
    it('returns null when not found', async () => {
      (AnimalReportModel.findById as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      expect(await repo.getReportById('nope')).toBeNull();
    });
  });

  describe('getAllReports', () => {
    it('returns all reports sorted by createdAt desc', async () => {
      const sortMock = jest.fn().mockResolvedValue([mockReport]);
      (AnimalReportModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: sortMock }) });
      expect(await repo.getAllReports()).toEqual([mockReport]);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
    it('returns empty array when no reports', async () => {
      (AnimalReportModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getAllReports()).toEqual([]);
    });
  });

  describe('getReportsBySpecies', () => {
    it('uses case-insensitive regex', async () => {
      (AnimalReportModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([mockReport]) }) });
      expect(await repo.getReportsBySpecies('cat')).toEqual([mockReport]);
      expect(AnimalReportModel.find).toHaveBeenCalledWith({ species: { $regex: 'cat', $options: 'i' } });
    });
    it('returns empty array when no match', async () => {
      (AnimalReportModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getReportsBySpecies('dragon')).toEqual([]);
    });
  });

  describe('getMyReports', () => {
    it('queries by reportedBy userId', async () => {
      (AnimalReportModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([mockReport]) }) });
      expect(await repo.getMyReports('user123')).toEqual([mockReport]);
      expect(AnimalReportModel.find).toHaveBeenCalledWith({ reportedBy: 'user123' });
    });
    it('returns empty array when user has no reports', async () => {
      (AnimalReportModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getMyReports('user999')).toEqual([]);
    });
  });

  describe('updateReportStatus', () => {
    it('updates status to approved and calls save', async () => {
      const doc = { ...mockReport, save: jest.fn().mockResolvedValue(undefined) };
      (AnimalReportModel.findById as jest.Mock).mockResolvedValue(doc);
      await repo.updateReportStatus('report123', 'approved');
      expect(doc.status).toBe('approved');
      expect(doc.save).toHaveBeenCalled();
    });
    it('updates status to rejected and calls save', async () => {
      const doc = { ...mockReport, save: jest.fn().mockResolvedValue(undefined) };
      (AnimalReportModel.findById as jest.Mock).mockResolvedValue(doc);
      await repo.updateReportStatus('report123', 'rejected');
      expect(doc.status).toBe('rejected');
      expect(doc.save).toHaveBeenCalled();
    });
    it('appends rejectionReason to description when rejected', async () => {
      const doc = { ...mockReport, description: 'Found stray cat', save: jest.fn().mockResolvedValue(undefined) };
      (AnimalReportModel.findById as jest.Mock).mockResolvedValue(doc);
      await repo.updateReportStatus('report123', 'rejected', 'Blurry photo');
      expect(doc.description).toContain('Rejection reason: Blurry photo');
    });
    it('does NOT append rejection reason when approving', async () => {
      const doc = { ...mockReport, description: 'Found stray cat', save: jest.fn().mockResolvedValue(undefined) };
      (AnimalReportModel.findById as jest.Mock).mockResolvedValue(doc);
      await repo.updateReportStatus('report123', 'approved');
      expect(doc.description).toBe('Found stray cat');
    });
    it('does NOT append if rejectionReason is undefined even when rejected', async () => {
      const doc = { ...mockReport, description: 'Found stray cat', save: jest.fn().mockResolvedValue(undefined) };
      (AnimalReportModel.findById as jest.Mock).mockResolvedValue(doc);
      await repo.updateReportStatus('report123', 'rejected');
      expect(doc.description).toBe('Found stray cat');
    });
    it('returns null when report not found', async () => {
      (AnimalReportModel.findById as jest.Mock).mockResolvedValue(null);
      expect(await repo.updateReportStatus('nope', 'approved')).toBeNull();
    });
  });

  describe('deleteReport', () => {
    it('returns true when deleted', async () => {
      (AnimalReportModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockReport);
      expect(await repo.deleteReport('report123')).toBe(true);
    });
    it('returns false when not found', async () => {
      (AnimalReportModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
      expect(await repo.deleteReport('nope')).toBe(false);
    });
  });
});