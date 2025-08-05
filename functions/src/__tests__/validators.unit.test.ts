import { testEnv, createTestUser, createTestGroup, cleanupTestData, admin } from './unit-setup';
import { 
  validateUserExists, 
  validateGroupExists, 
  validateUserGroupMembership,
  validateUserNotInGroup,
  validateSingleAdmin,
  validateUserIsGroupAdmin
} from '../utils/validators';

describe('Validation Utilities (Unit Tests)', () => {
  let testUserId: string;
  let testGroupId: string;

  beforeEach(async () => {
    await cleanupTestData();
    testUserId = await createTestUser();
    testGroupId = await createTestGroup();
  });

  afterAll(async () => {
    await cleanupTestData();
    testEnv.cleanup();
  });

  describe('validateUserExists', () => {
    it('should return user reference and data for existing user', async () => {
      const result = await validateUserExists(testUserId);
      
      expect(result).toHaveProperty('ref');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('displayName', 'Test User');
      expect(result.data).toHaveProperty('email', 'test@example.com');
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = 'non-existent-user-id';
      
      await expect(validateUserExists(nonExistentId)).rejects.toThrow('User not found');
    });

    it('should throw error for empty user ID', async () => {
      await expect(validateUserExists('')).rejects.toThrow('documentPath');
    });
  });

  describe('validateGroupExists', () => {
    it('should return group reference for existing group', async () => {
      const result = await validateGroupExists(testGroupId);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testGroupId);
    });

    it('should throw error for non-existent group', async () => {
      const nonExistentId = 'non-existent-group-id';
      
      await expect(validateGroupExists(nonExistentId)).rejects.toThrow('Group not found');
    });

    it('should throw error for empty group ID', async () => {
      await expect(validateGroupExists('')).rejects.toThrow('documentPath');
    });
  });

  describe('validateUserGroupMembership', () => {
    beforeEach(async () => {
      // Add user to group
      const db = admin.firestore();
      await db.collection('users').doc(testUserId)
        .collection('groups').doc(testGroupId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: false
        });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(testUserId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: false
        });
    });

    it('should return both references for valid membership', async () => {
      const result = await validateUserGroupMembership(testUserId, testGroupId);
      
      expect(result).toHaveProperty('userGroupRef');
      expect(result).toHaveProperty('groupMemberRef');
      expect(result.userGroupRef.id).toBe(testGroupId);
      expect(result.groupMemberRef.id).toBe(testUserId);
    });

    it('should throw error when user is not in group', async () => {
      const otherUserId = await createTestUser();
      
      await expect(validateUserGroupMembership(otherUserId, testGroupId))
        .rejects.toThrow('User is not a member of this group');
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentUserId = 'non-existent-user';
      
      await expect(validateUserGroupMembership(nonExistentUserId, testGroupId))
        .rejects.toThrow('User is not a member of this group');
    });

    it('should throw error for non-existent group', async () => {
      const nonExistentGroupId = 'non-existent-group';
      
      await expect(validateUserGroupMembership(testUserId, nonExistentGroupId))
        .rejects.toThrow('User is not a member of this group');
    });
  });

  describe('validateUserNotInGroup', () => {
    it('should return references when user is not in group', async () => {
      const otherUserId = await createTestUser();
      
      const result = await validateUserNotInGroup(otherUserId, testGroupId);
      
      expect(result).toHaveProperty('userGroupRef');
      expect(result).toHaveProperty('groupMemberRef');
    });

    it('should throw error when user is already in group', async () => {
      // Add user to group first
      const db = admin.firestore();
      await db.collection('users').doc(testUserId)
        .collection('groups').doc(testGroupId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: false
        });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(testUserId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: false
        });

      await expect(validateUserNotInGroup(testUserId, testGroupId))
        .rejects.toThrow('User is already a member of this group');
    });
  });

  describe('validateSingleAdmin', () => {
    beforeEach(async () => {
      // Add user to group as admin
      const db = admin.firestore();
      await db.collection('users').doc(testUserId)
        .collection('groups').doc(testGroupId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: true
        });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(testUserId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: true
        });
    });

    it('should not throw error when removing admin and other admins exist', async () => {
      // Add another admin
      const otherUserId = await createTestUser();
      const db = admin.firestore();
      await db.collection('users').doc(otherUserId)
        .collection('groups').doc(testGroupId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: true
        });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(otherUserId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: true
        });

      // Should not throw when removing admin (isAdmin = false)
      await expect(validateSingleAdmin(testGroupId, false)).resolves.not.toThrow();
    });

    it('should throw error when removing last admin', async () => {
      // Remove admin status first to have 0 admins
      const db = admin.firestore();
      await db.collection('users').doc(testUserId)
        .collection('groups').doc(testGroupId).update({ isAdmin: false });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(testUserId).update({ isAdmin: false });

      // Should throw when trying to remove admin status when there are 0 admins
      await expect(validateSingleAdmin(testGroupId, false))
        .rejects.toThrow('Group must have an admin');
    });

    it('should not throw error when adding admin to group without admin', async () => {
      // Remove admin status first
      const db = admin.firestore();
      await db.collection('users').doc(testUserId)
        .collection('groups').doc(testGroupId).update({ isAdmin: false });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(testUserId).update({ isAdmin: false });

      await expect(validateSingleAdmin(testGroupId, true)).resolves.not.toThrow();
    });
  });

  describe('validateUserIsGroupAdmin', () => {
    beforeEach(async () => {
      // Add user to group as admin
      const db = admin.firestore();
      await db.collection('users').doc(testUserId)
        .collection('groups').doc(testGroupId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: true
        });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(testUserId).set({
          balance: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isAdmin: true
        });
    });

    it('should not throw error when user is admin', async () => {
      await expect(validateUserIsGroupAdmin(testUserId, testGroupId))
        .resolves.not.toThrow();
    });

    it('should throw error when user is not admin', async () => {
      // Change user to non-admin
      const db = admin.firestore();
      await db.collection('users').doc(testUserId)
        .collection('groups').doc(testGroupId).update({ isAdmin: false });
      
      await db.collection('groups').doc(testGroupId)
        .collection('members').doc(testUserId).update({ isAdmin: false });

      await expect(validateUserIsGroupAdmin(testUserId, testGroupId))
        .rejects.toThrow('Only group admins can perform this action');
    });

    it('should throw error when user is not in group', async () => {
      const otherUserId = await createTestUser();
      
      await expect(validateUserIsGroupAdmin(otherUserId, testGroupId))
        .rejects.toThrow('User is not a member of this group');
    });
  });
}); 