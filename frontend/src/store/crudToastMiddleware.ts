import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { toast } from '@/utils/toast';

import {

  closeComplianceCase,

  createComplianceCase,

  deleteComplianceCase,

  updateComplianceCase,

} from './slices/complianceSlice';

import { deleteCustomer, updateCustomer } from './slices/customerSlice';

import {

  assignExtinguisher,

  createExtinguisher,

  deleteExtinguisher,

  updateExtinguisher,

} from './slices/extinguisherSlice';

import { markNotificationRead } from './slices/notificationSlice';



const SUCCESS_MESSAGES: Partial<Record<string, string>> = {

  [updateCustomer.fulfilled.type]: 'Customer updated successfully',

  [deleteCustomer.fulfilled.type]: 'Customer deleted successfully',

  [createExtinguisher.fulfilled.type]: 'Fire extinguisher registered successfully',

  [updateExtinguisher.fulfilled.type]: 'Fire extinguisher updated successfully',

  [deleteExtinguisher.fulfilled.type]: 'Fire extinguisher deleted successfully',

  [createComplianceCase.fulfilled.type]: 'Compliance case created successfully',

  [updateComplianceCase.fulfilled.type]: 'Compliance case updated successfully',

  [closeComplianceCase.fulfilled.type]: 'Compliance case closed successfully',

  [deleteComplianceCase.fulfilled.type]: 'Compliance case deleted successfully',

  [markNotificationRead.fulfilled.type]: 'Notification marked as read',

};



const crudToastListener = createListenerMiddleware();



crudToastListener.startListening({

  matcher: assignExtinguisher.fulfilled.match,

  effect: (action) => {

    const ext = action.payload;

    toast.success(

      `Fire extinguisher ${ext.serialNumber} has been assigned successfully`,

    );

  },

});



crudToastListener.startListening({

  matcher: assignExtinguisher.rejected.match,

  effect: (action) => {

    toast.error(

      (action.payload as string) || 'Failed to assign fire extinguisher',

    );

  },

});



crudToastListener.startListening({

  matcher: isAnyOf(

    updateCustomer.fulfilled,

    deleteCustomer.fulfilled,

    createExtinguisher.fulfilled,

    updateExtinguisher.fulfilled,

    deleteExtinguisher.fulfilled,

    createComplianceCase.fulfilled,

    updateComplianceCase.fulfilled,

    closeComplianceCase.fulfilled,

    deleteComplianceCase.fulfilled,

    markNotificationRead.fulfilled,

  ),

  effect: (action) => {

    const message = SUCCESS_MESSAGES[action.type];

    if (message) toast.success(message);

  },

});



export const crudToastMiddleware = crudToastListener.middleware;

