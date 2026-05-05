import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  CardView,
  DataTable,
  Dropzone,
  TextFilter,
  useToggle,
} from '@openedx/paragon';

import { RequestStatus } from '../../data/constants';
import { sortFiles } from './utils';
import messages from './messages';

import InfoModal from './InfoModal';
import FileInput, { useFileInput } from './FileInput';
import {
  GalleryCard,
  TableActions,
  RowStatus,
  MoreInfoColumn,
  FilterStatus,
  Footer,
  TranscriptColumn,
} from './table-components';
import ApiStatusToast from './ApiStatusToast';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const FileTableContext = createContext({});

const MoreInfoCell = ({ row }) => {
  const {
    handleLockFile,
    handleBulkDownload,
    handleOpenFileInfo,
    handleOpenDeleteConfirmation,
    fileType,
  } = useContext(FileTableContext);
  return (
    <MoreInfoColumn
      row={row}
      handleLock={handleLockFile}
      handleBulkDownload={handleBulkDownload}
      handleOpenFileInfo={handleOpenFileInfo}
      handleOpenDeleteConfirmation={handleOpenDeleteConfirmation}
      fileType={fileType}
    />
  );
};

MoreInfoCell.propTypes = {
  row: PropTypes.shape({}).isRequired,
};

const TranscriptCell = ({ row }) => {
  const { handleOpenFileInfo } = useContext(FileTableContext);
  return <TranscriptColumn row={row} onClick={handleOpenFileInfo} />;
};

TranscriptCell.propTypes = {
  row: PropTypes.shape({}).isRequired,
};

const GalleryCardCell = ({ className, original }) => {
  const {
    handleLockFile,
    handleBulkDownload,
    handleOpenFileInfo,
    handleOpenDeleteConfirmation,
    thumbnailPreview,
    fileType,
  } = useContext(FileTableContext);
  return (
    <GalleryCard
      handleLockFile={handleLockFile}
      handleBulkDownload={handleBulkDownload}
      handleOpenDeleteConfirmation={handleOpenDeleteConfirmation}
      handleOpenFileInfo={handleOpenFileInfo}
      thumbnailPreview={thumbnailPreview}
      className={className}
      original={original}
      fileType={fileType}
    />
  );
};

GalleryCardCell.propTypes = {
  className: PropTypes.string,
  original: PropTypes.shape({}).isRequired,
};

GalleryCardCell.defaultProps = {
  className: null,
};

const FileTable = ({
  files,
  data,
  handleAddFile,
  handleLockFile,
  handleDeleteFile,
  handleDownloadFile,
  handleUsagePaths,
  handleErrorReset,
  handleFileOrder,
  tableColumns,
  maxFileSize,
  thumbnailPreview,
  renderInfoModalContent,
}) => {
  const intl = useIntl();

  const uniqueFiles = useMemo(() => {
    const seen = new Set();
    return (files || []).filter((file) => {
      if (!file || !file.id || seen.has(file.id)) { return false; }
      seen.add(file.id);
      return true;
    });
  }, [files]);

  const pageCount = Math.ceil(uniqueFiles.length / 50);
  const columnSizes = {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
    xl: 2,
  };
  const { defaultView } = useSelector((state) => state.videos);
  const [isDeleteOpen, setDeleteOpen, setDeleteClose] = useToggle(false);
  const [isDownloadOpen, setDownloadOpen, setDownloadClose] = useToggle(false);
  const [isAssetInfoOpen, openAssetInfo, closeAssetinfo] = useToggle(false);
  const [isAddOpen, setAddOpen, setAddClose] = useToggle(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDeleteConfirmationOpen, openDeleteConfirmation, closeDeleteConfirmation] = useToggle(false);
  const [initialState, setInitialState] = useState({
    filters: [],
    hiddenColumns: [],
    pageIndex: 0,
    pageSize: 50,
    selectedRowIds: {},
    sortBy: [],
  });

  const {
    loadingStatus,
    usagePathStatus,
    usageErrorMessages,
    encodingsDownloadUrl,
    supportedFileFormats,
    fileType,
  } = data;
  const defaultCurrentView = (fileType === 'video' && localStorage.getItem('videosCurrentView')) || (fileType === 'file' && localStorage.getItem('filesCurrentView')) || defaultView;
  const [currentView, setCurrentView] = useState(defaultCurrentView);

  useEffect(() => {
    if (!isEmpty(selectedRows) && Object.keys(selectedRows[0]).length > 0) {
      const updatedRows = [];
      selectedRows.forEach(row => {
        const currentFile = row.original;
        if (currentFile) {
          const [updatedFile] = uniqueFiles.filter(file => file.id === currentFile?.id);
          updatedRows.push({ original: updatedFile });
        }
      });
      setSelectedRows(updatedRows);
    }
  }, [uniqueFiles]);

  const fileInputControl = useFileInput({
    onAddFile: (uploads) => handleAddFile(uploads),
    setSelectedRows,
    setAddOpen,
  });
  const handleDropzoneAsset = ({ fileData, handleError }) => {
    try {
      const file = fileData.get('file');
      handleAddFile([file]);
    } catch (error) {
      handleError(error);
    }
  };

  const handleSort = (sortType) => {
    const newFileIdOrder = sortFiles(files, sortType);
    handleFileOrder({ newFileIdOrder, sortType });
  };

  const handleBulkDelete = () => {
    closeDeleteConfirmation();
    setDeleteOpen();
    handleErrorReset({ errorType: 'delete' });
    const fileIdsToDelete = selectedRows.map(row => row.original.id);
    fileIdsToDelete.forEach(id => handleDeleteFile(id));
  };

  const handleBulkDownload = useCallback(async (selectedFlatRows) => {
    handleErrorReset({ errorType: 'download' });
    setSelectedRows(selectedFlatRows);
    setDownloadOpen();
    handleDownloadFile(selectedFlatRows);
  }, []);

  const handleErrorResetRef = useRef(handleErrorReset);
  handleErrorResetRef.current = handleErrorReset;
  const handleUsagePathsRef = useRef(handleUsagePaths);
  handleUsagePathsRef.current = handleUsagePaths;

  const handleOpenDeleteConfirmation = useCallback((selectedFlatRows) => {
    setSelectedRows(selectedFlatRows);
    openDeleteConfirmation();
  }, [openDeleteConfirmation]);

  const handleOpenFileInfo = useCallback((original) => {
    handleErrorResetRef.current({ errorType: 'usageMetrics' });
    setSelectedRows([{ original }]);
    handleUsagePathsRef.current(original);
    openAssetInfo();
  }, [openAssetInfo]);

  const headerActions = ({ selectedFlatRows }) => (
    <TableActions
      {...{
        selectedFlatRows,
        fileInputControl,
        encodingsDownloadUrl,
        handleSort,
        handleBulkDownload,
        handleOpenDeleteConfirmation,
        supportedFileFormats,
        fileType,
        setInitialState,
      }}
    />
  );

  const columns = useMemo(() => {
    const cols = [...tableColumns];
    if (!cols.some(col => col.id === 'moreInfo')) {
      cols.push({ id: 'moreInfo', Header: '', Cell: MoreInfoCell });
    }
    const transcriptColIdx = cols.findIndex(col => col.id === 'transcriptStatus');
    if (transcriptColIdx !== -1) {
      cols[transcriptColIdx] = { ...cols[transcriptColIdx], Cell: TranscriptCell };
    }
    return cols;
  }, [tableColumns]);

  const contextValue = useMemo(() => ({
    handleLockFile,
    handleBulkDownload,
    handleOpenFileInfo,
    handleOpenDeleteConfirmation,
    thumbnailPreview,
    fileType,
  }), [
    handleLockFile, handleBulkDownload, handleOpenFileInfo,
    handleOpenDeleteConfirmation, thumbnailPreview, fileType,
  ]);

  return (
    <FileTableContext.Provider value={contextValue}>
      <div className="files-table">
        <DataTable
          isFilterable
          isLoading={loadingStatus === RequestStatus.IN_PROGRESS}
          isSortable
          isSelectable
          isPaginated
          initialTableOptions={{ getRowId: (row) => row.id }}
          defaultColumnValues={{ Filter: TextFilter }}
          dataViewToggleOptions={{
            isDataViewToggleEnabled: true,
            onDataViewToggle: (val) => {
              if (fileType === 'video') {
                localStorage.setItem('videosCurrentView', val);
                setCurrentView(val);
              } else {
              // There's only 2 fileTypes currently being used i.e. video or file
                localStorage.setItem('filesCurrentView', val);
                setCurrentView(val);
              }
            },
            defaultActiveStateValue: defaultCurrentView,
            togglePlacement: 'left',
          }}
          initialState={initialState}
          tableActions={headerActions}
          bulkActions={headerActions}
          columns={columns}
          itemCount={uniqueFiles.length}
          pageCount={pageCount}
          data={uniqueFiles}
          FilterStatusComponent={FilterStatus}
          RowStatusComponent={RowStatus}
        >
          {isEmpty(uniqueFiles) && loadingStatus !== RequestStatus.IN_PROGRESS ? (
            <Dropzone
              data-testid="files-dropzone"
              accept={supportedFileFormats}
              onProcessUpload={handleDropzoneAsset}
              maxSize={maxFileSize}
              errorMessages={{
                invalidSize: intl.formatMessage(messages.fileSizeError),
                multipleDragged: 'Dropzone can only upload a single file.',
              }}
            />
          ) : (
            <div data-testid="files-data-table" className="bg-light-200">
              <DataTable.TableControlBar />
              <hr className="mb-5 border-light-700" />
              { currentView === 'card' && <CardView CardComponent={GalleryCardCell} columnSizes={columnSizes} selectionPlacement="left" skeletonCardCount={6} /> }
              { currentView === 'list' && <DataTable.Table /> }
              <DataTable.EmptyTable content={intl.formatMessage(messages.noResultsFoundMessage)} />
              <Footer />
            </div>
          )}

          <ApiStatusToast
            actionType={intl.formatMessage(messages.apiStatusDeletingAction)}
            selectedRowCount={selectedRows.length}
            isOpen={isDeleteOpen}
            setClose={setDeleteClose}
            setSelectedRows={setSelectedRows}
            fileType={fileType}
          />

          {fileType === 'file' && (
          <ApiStatusToast
            actionType={intl.formatMessage(messages.apiStatusAddingAction)}
            selectedRowCount={selectedRows.length}
            isOpen={isAddOpen}
            setClose={setAddClose}
            setSelectedRows={setSelectedRows}
            fileType={fileType}
          />
          )}

          <ApiStatusToast
            actionType={intl.formatMessage(messages.apiStatusDownloadingAction)}
            selectedRowCount={selectedRows.length}
            isOpen={isDownloadOpen}
            setClose={setDownloadClose}
            setSelectedRows={setSelectedRows}
            fileType={fileType}
          />

          <DeleteConfirmationModal
            {...{
              isDeleteConfirmationOpen,
              closeDeleteConfirmation,
              handleBulkDelete,
              selectedRows,
              fileType,
            }}
          />
        </DataTable>
        <FileInput key="generic-file-upload" fileInput={fileInputControl} supportedFileFormats={supportedFileFormats} />
        {isAssetInfoOpen && selectedRows[0] && (
        <InfoModal
          file={selectedRows[0].original}
          onClose={closeAssetinfo}
          isOpen={isAssetInfoOpen}
          thumbnailPreview={thumbnailPreview}
          usagePathStatus={usagePathStatus}
          error={usageErrorMessages}
          renderContent={renderInfoModalContent}
        />
        )}
      </div>
    </FileTableContext.Provider>
  );
};

FileTable.propTypes = {
  files: PropTypes.arrayOf(PropTypes.shape({})),
  data: PropTypes.shape({
    loadingStatus: PropTypes.string.isRequired,
    usagePathStatus: PropTypes.string.isRequired,
    usageErrorMessages: PropTypes.arrayOf(PropTypes.string).isRequired,
    encodingsDownloadUrl: PropTypes.string,
    supportedFileFormats: PropTypes.shape({}),
    fileType: PropTypes.string.isRequired,
  }).isRequired,
  handleAddFile: PropTypes.func.isRequired,
  handleDeleteFile: PropTypes.func.isRequired,
  handleDownloadFile: PropTypes.func.isRequired,
  handleUsagePaths: PropTypes.func.isRequired,
  handleLockFile: PropTypes.func,
  handleErrorReset: PropTypes.func.isRequired,
  handleFileOrder: PropTypes.func.isRequired,
  tableColumns: PropTypes.arrayOf(PropTypes.shape({
    Header: PropTypes.string,
    accessor: PropTypes.string,
  })).isRequired,
  maxFileSize: PropTypes.number.isRequired,
  thumbnailPreview: PropTypes.func.isRequired,
  renderInfoModalContent: PropTypes.func,
};

FileTable.defaultProps = {
  files: null,
  handleLockFile: () => {},
  renderInfoModalContent: null,
};

export default FileTable;
