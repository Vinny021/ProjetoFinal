import { useEffect, useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Text,
  Box,
  Stack,
  Skeleton,
  Button,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";

export interface Files {
  filename: string;
  id: number;
}

function Dashboard() {
  const [files, setFiles] = useState<Files[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setIsLoading(false);
    axios.get("http://localhost:3000/getFilesAvailable").then((response) => {
      setFiles(response.data);
      setIsLoading(true);
    });
  }, []);

  const findDownload = (id: number) => {
    axios
      .post("http://localhost:3000/notifyRequest", { fileId: id })
      .then(() => {
        toast({
          title: "Download feito com sucesso",
          description: "Download feita com sucesso na pasta do computador.",
          status: "success",
          duration: 1000,
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Erro desconhecido",
          description: "Verifique as informações e tente novamente",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      });
  };

  return (
    <>
      <Flex flexDirection="column" w="100%" marginTop={10}>
        <Box margin="0 auto">
          <Text fontSize="3xl" fontWeight={"bold"} w="100%">
            Baixar
          </Text>
          {isLoading ? (
            <Table variant="simple" width={"70vw"}>
              <Thead>
                <Tr>
                  <Th>Titulo</Th>
                  <Th>Baixar</Th>
                </Tr>
              </Thead>
              <Tbody>
                {files.map((elem: Files, i: number) => {
                  return (
                    <Tr key={i}>
                      <Td>{elem.filename}</Td>
                      <Td>
                        <Button
                          onClick={() => {
                            findDownload(elem.id);
                          }}
                        >
                          Download
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            <Stack mt="50px" width={"70vw"}>
              <Skeleton height="57px" />
              <Skeleton height="57px" />
              <Skeleton height="57px" />
              <Skeleton height="57px" />
              <Skeleton height="57px" />
              <Skeleton height="57px" />
              <Skeleton height="57px" />
              <Skeleton height="57px" />
              <Skeleton height="57px" />
            </Stack>
          )}
        </Box>
      </Flex>
    </>
  );
}
export default Dashboard;
